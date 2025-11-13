-- =============================================
-- CORRECCIÓN DE SUSCRIPCIONES Y SISTEMA DE PERFILES
-- =============================================

-- 1. TABLA DE PERFILES (Sistema multi-perfil como Netflix)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'default-avatar.png',
    is_kids BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'es',
    autoplay_next BOOLEAN DEFAULT TRUE,
    autoplay_previews BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_profile_name_per_user UNIQUE(user_id, name)
);

-- Índices para perfiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 2. TABLA DE MÉTODOS DE PAGO (Mejorada)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_brand VARCHAR(50) NOT NULL,
    card_last_four VARCHAR(4) NOT NULL,
    expiry_month INTEGER NOT NULL,
    expiry_year INTEGER NOT NULL,
    billing_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- 3. TABLA DE HISTORIAL DE VISUALIZACIÓN POR PERFIL
-- =============================================
CREATE TABLE IF NOT EXISTS profile_watch_history (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_profile_movie UNIQUE(profile_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_profile ON profile_watch_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_movie ON profile_watch_history(movie_id);

-- 4. TABLA DE FAVORITOS POR PERFIL
-- =============================================
CREATE TABLE IF NOT EXISTS profile_favorites (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_profile_favorite UNIQUE(profile_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_profile ON profile_favorites(profile_id);

-- =============================================
-- FUNCIÓN CORREGIDA: Crear suscripción
-- =============================================
CREATE OR REPLACE FUNCTION create_subscription(
    p_user_id INTEGER,
    p_plan_id INTEGER,
    p_payment_method_id INTEGER,
    p_coupon_code VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_plan_price DECIMAL(10,2);
    v_discount DECIMAL(10,2) := 0;
    v_final_price DECIMAL(10,2);
    v_subscription_id INTEGER;
    v_coupon_id INTEGER;
    v_coupon RECORD;
BEGIN
    -- Obtener precio del plan
    SELECT price INTO v_plan_price
    FROM subscription_plans
    WHERE id = p_plan_id AND is_active = TRUE;

    IF v_plan_price IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Plan no encontrado'
        );
    END IF;

    -- Aplicar cupón si existe
    IF p_coupon_code IS NOT NULL THEN
        SELECT * INTO v_coupon
        FROM discount_coupons
        WHERE code = p_coupon_code
        AND is_active = TRUE
        AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
        AND (max_uses IS NULL OR current_uses < max_uses);

        IF FOUND THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := v_plan_price * (v_coupon.discount_value / 100);
            ELSE
                v_discount := v_coupon.discount_value;
            END IF;

            v_coupon_id := v_coupon.id;

            -- Incrementar uso del cupón
            UPDATE discount_coupons
            SET current_uses = current_uses + 1
            WHERE id = v_coupon_id;
        END IF;
    END IF;

    v_final_price := GREATEST(0, v_plan_price - v_discount);

    -- Crear suscripción
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        start_date,
        end_date,
        payment_method_id,
        coupon_id,
        price_paid
    ) VALUES (
        p_user_id,
        p_plan_id,
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        p_payment_method_id,
        v_coupon_id,
        v_final_price
    )
    RETURNING id INTO v_subscription_id;

    -- Registrar pago
    INSERT INTO payment_history (
        user_id,
        subscription_id,
        amount,
        payment_method_id,
        status,
        payment_date
    ) VALUES (
        p_user_id,
        v_subscription_id,
        v_final_price,
        p_payment_method_id,
        'completed',
        CURRENT_TIMESTAMP
    );

    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'amount_paid', v_final_price,
        'message', 'Suscripción creada exitosamente'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al crear suscripción: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Crear perfil
-- =============================================
CREATE OR REPLACE FUNCTION create_profile(
    p_user_id INTEGER,
    p_name VARCHAR,
    p_avatar VARCHAR DEFAULT 'default-avatar.png',
    p_is_kids BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    v_profile_count INTEGER;
    v_max_profiles INTEGER;
    v_profile_id INTEGER;
BEGIN
    -- Verificar suscripción activa
    IF NOT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = p_user_id AND status = 'active'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No tienes una suscripción activa'
        );
    END IF;

    -- Obtener límite de perfiles según el plan
    SELECT sp.screens INTO v_max_profiles
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id AND us.status = 'active'
    LIMIT 1;

    -- Contar perfiles existentes
    SELECT COUNT(*) INTO v_profile_count
    FROM profiles
    WHERE user_id = p_user_id;

    IF v_profile_count >= v_max_profiles THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Has alcanzado el límite de perfiles para tu plan'
        );
    END IF;

    -- Crear perfil
    INSERT INTO profiles (user_id, name, avatar, is_kids)
    VALUES (p_user_id, p_name, p_avatar, p_is_kids)
    RETURNING id INTO v_profile_id;

    RETURN json_build_object(
        'success', true,
        'profile_id', v_profile_id,
        'message', 'Perfil creado exitosamente'
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un perfil con ese nombre'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al crear perfil: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener perfiles de un usuario
-- =============================================
CREATE OR REPLACE FUNCTION get_user_profiles(p_user_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    avatar VARCHAR,
    is_kids BOOLEAN,
    language VARCHAR,
    autoplay_next BOOLEAN,
    autoplay_previews BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.avatar, p.is_kids, p.language, 
           p.autoplay_next, p.autoplay_previews, p.created_at
    FROM profiles p
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener historial de un perfil
-- =============================================
CREATE OR REPLACE FUNCTION get_profile_watch_history(p_profile_id INTEGER)
RETURNS TABLE (
    movie_id INTEGER,
    progress INTEGER,
    completed BOOLEAN,
    last_watched TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT h.movie_id, h.progress, h.completed, h.last_watched
    FROM profile_watch_history h
    WHERE h.profile_id = p_profile_id
    ORDER BY h.last_watched DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Actualizar progreso de visualización
-- =============================================
CREATE OR REPLACE FUNCTION update_watch_progress(
    p_profile_id INTEGER,
    p_movie_id INTEGER,
    p_progress INTEGER,
    p_completed BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO profile_watch_history (profile_id, movie_id, progress, completed, last_watched)
    VALUES (p_profile_id, p_movie_id, p_progress, p_completed, CURRENT_TIMESTAMP)
    ON CONFLICT (profile_id, movie_id)
    DO UPDATE SET
        progress = p_progress,
        completed = p_completed,
        last_watched = CURRENT_TIMESTAMP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Actualizar updated_at en perfiles
-- =============================================
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_timestamp();

-- =============================================
-- DATOS DE EJEMPLO: Avatares predeterminados
-- =============================================
INSERT INTO profiles (user_id, name, avatar, is_kids)
SELECT 1, 'Perfil Principal', 'avatar-1.png', FALSE
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
AND NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- VISTA: Suscripciones con información completa
-- =============================================
CREATE OR REPLACE VIEW v_user_subscriptions_full AS
SELECT 
    us.id,
    us.user_id,
    u.email,
    u.name as user_name,
    sp.name as plan_name,
    sp.price as plan_price,
    sp.quality,
    sp.screens,
    us.status,
    us.start_date,
    us.end_date,
    us.price_paid,
    pm.card_brand,
    pm.card_last_four,
    dc.code as coupon_code,
    CASE 
        WHEN us.end_date > CURRENT_TIMESTAMP THEN TRUE
        ELSE FALSE
    END as is_active,
    (SELECT COUNT(*) FROM profiles WHERE user_id = us.user_id) as profile_count
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN payment_methods pm ON us.payment_method_id = pm.id
LEFT JOIN discount_coupons dc ON us.coupon_id = dc.id;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
