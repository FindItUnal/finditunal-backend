-- Crear base y tablas para la aplicación FindItUnal
CREATE DATABASE IF NOT EXISTS objetos_perdidos;
USE objetos_perdidos;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Correo institucional',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada',
    name VARCHAR(255) NOT NULL COMMENT 'Nombre completo',
    phone_number VARCHAR(20) COMMENT 'Teléfono opcional',
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cuenta verificada',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'True = cuenta activa',
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Permisos',
    two_factor_secret VARCHAR(32) COMMENT 'Clave secreta para 2FA (base32)',
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si 2FA está habilitado',
    backup_codes JSON COMMENT 'Códigos de respaldo para 2FA en formato JSON',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL COMMENT 'Ej: "Llaves", "Electrónicos"'
);

-- Tabla de Ubicaciones
CREATE TABLE IF NOT EXISTS Locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL COMMENT 'Ej: "Edificio 404", "Cafetería Central"'
);

-- Tabla de Reportes
CREATE TABLE IF NOT EXISTS Reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Usuario que creó el reporte',
    category_id INT NOT NULL COMMENT 'Categoría del objeto',
    location_id INT NOT NULL COMMENT 'Ubicación del evento',
    title VARCHAR(255) NOT NULL COMMENT 'Título breve',
    description TEXT COMMENT 'Detalles adicionales',
    status ENUM('perdido', 'encontrado') NOT NULL,
    date_lost_or_found DATE NOT NULL COMMENT 'Fecha del evento',
    contact_method VARCHAR(255) NOT NULL COMMENT 'Descripcion de contacto',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (location_id) REFERENCES Locations(location_id)
);

-- Tabla de Imágenes
CREATE TABLE IF NOT EXISTS Images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL COMMENT 'URL de la imagen en almacenamiento',
    FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE
);

-- Insertar categorías
INSERT IGNORE INTO Categories (name) VALUES
('Electrónica'),
('Accesorios personales'),
('Documentos'),
('Ropa y calzado'),
('Bolsos y mochilas'),
('Llaves y tarjetas'),
('Libros y papelería'),
('Artículos deportivos'),
('Juguetes y entretenimiento'),
('Salud y cuidado personal'),
('Otros');

INSERT IGNORE INTO Locations (name) VALUES
('101 - Torre de Enfermería'),
('102 - Biblioteca Central Gabriel García Márquez (Central)'),
('103 - Centro Polideportivo'),
('104 - Auditorio León de Greffi'),
('201 - Derecho'),
('205 - Sociología (Ciencias Humanas)'),
('207 - Museo de Arquitectura Leopoldo Rother'),
('210 - Odontología'),
('212 - Aulas de Ciencias Humanas'),
('214 - Antonio Narino'),
('217 - Diseño Gráfico'),
('224 - Edificio Manuel Ancizar'),
('225 - Posgrados de Ciencias Humanas'),
('228 - Nuevo Edificio de Enfermería'),
('229 - Lenguas Extranjeras'),
('238 - Contaduría'),
('239 - Filosofía'),
('251 - Capilla'),
('301 - Bellas Artes'),
('305 - Conservatorio de Música'),
('309 - Talleres y aulas de construcción'),
('310 - Facultad de Ciencias Económicas'),
('311 - Facultad de Ciencias Económicas Bloque II'),
('314 - SINDU'),
('317 - Museo de Arte'),
('401 - Ingeniería Julio Garavito (El viejo)'),
('404 - Matemáticas y Física Y/o Takeuchi'),
('405 - Posgrados en Matemáticas y Física'),
('406 - Laboratorios de Ensayos de Materiales'),
('407 - Posgrados en Materiales'),
('408 - Laboratorio de Ensayos Hidráulicos'),
('409 - Laboratorio de Hidráulica'),
('411 - Laboratorios Ingeniería Eléctrica y Mecánica (Patios)'),
('412 - Laboratorios Ingeniería Química'),
('413 - Observatorio Astronómico'),
('421 - Biología'),
('425 - Instituto de Ciencias Naturales'),
('426 - Instituto de Genética'),
('431 - IPABM (antiguo IDAP)'),
('433 - Almacén general e Imprenta'),
('434 - IPABM'),
('435 - Talleres de mantenimiento'),
('436 - Transportes'),
('437 - Centro de acopio de residuos sólidos'),
('438 - Talleres y vestieres de mantenimiento'),
('450 - Farmacia'),
('451 - Química'),
('452 - Posgrados Bioquímica y Carbones'),
('453 - Guillermina Uribe Bone (Aulas de Ingeniería)'),
('454 - Edificio de Ciencia y Tecnología (CYT)'),
('471 - Medicina'),
('473 - Casa de animales'),
('474 - Cafetería de Medicina'),
('476 - Facultad de Ciencias'),
('477 - PDSAV'),
('480 - CEMU'),
('481 - Facultad de Veterinaria'),
('500 - Ciencias Agrarias'),
('501 - Cirugía y clínica grandes animales'),
('502 - Aulas de histopatología e inseminación'),
('503 - Auditorio, anfiteatro y microbiología'),
('504 - Patología aviar y URBAS'),
('505 - Laboratorio de inseminación y corral'),
('506 - Laboratorio patología y corral'),
('507 - Clínica de pequeños animales'),
('508 - Oficinas Facultad de Veterinaria'),
('510 - Aulas y oficinas Facultad de Veterinaria'),
('561 - Bloque Posgrados de Veterinaria'),
('561A - Oficinas producción animal'),
('561B - Posgrado reproducción animal'),
('561C - Bioterio y establos'),
('571 - Hemeroteca Nacional'),
('606 - IICR'),
('608 - Centro de Computo'),
('610 - ICAC'),
('615 - Laboratorio de Química'),
('701 - Cine y Televisión'),
('731 - Estadio Alfonso López'),
('861 - Edificio Uriel Gutiérrez'),
('862 - Unidad Camilo Torres (A, B, C)'),
('921 - Hospital Universitario Nacional'),
('Él Freud'),
('La playita'),
('Plaza Central (Che)'),
('303 - Nuevo Espacio Para Las Artes (NEA)'),
('El bunker / tienda universitaria'),
('La perola'),
('Portería Calle 53'),
('Portería carrera 30'),
('Portería de la capilla'),
('Portería calle 26'),
('Portería ICA'),
('Portería Hemeroteca'),
('Portería carrera 45'),
('ICONTEC'),
('Agustín Codazzi');

-- Índices para optimización
CREATE INDEX idx_category ON Reports(category_id);
CREATE INDEX idx_location ON Reports(location_id);
CREATE INDEX idx_date ON Reports(date_lost_or_found);
CREATE FULLTEXT INDEX idx_title_description ON Reports(title,description);
CREATE INDEX idx_reports_user_id ON Reports(user_id);
CREATE INDEX idx_reports_status ON Reports(status);
CREATE INDEX idx_images_report_id ON Images(report_id);
CREATE INDEX idx_users_email ON Users(email);
