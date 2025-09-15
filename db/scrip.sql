CREATE DATABASE colegio;
USE colegio;

-- Usuarios del sistema (solo admins y usuarios con acceso)
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_usuario VARCHAR(12) NOT NULL UNIQUE,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo_usuario VARCHAR(100) NOT NULL UNIQUE,
    contrasena_usuario VARCHAR(100) NOT NULL,    
    telefono VARCHAR(15),
    direccion VARCHAR(255),
    rol VARCHAR(50) NOT NULL 
);

-- Alumnos (NO entran al sistema, solo se gestionan)
CREATE TABLE alumno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_alumnos VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    curso VARCHAR(10) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    orden_llegada INT UNIQUE NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    comuna VARCHAR(500) NOT NULL
);

-- Apoderados (NO entran al sistema, solo se gestionan)
CREATE TABLE apoderados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_apoderado VARCHAR(12) NOT NULL UNIQUE,
    nombre_apoderado VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    alumno_id INT NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo_apoderado VARCHAR(350) NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

CREATE TABLE matriculas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT UNIQUE,
    nombre_archivo VARCHAR(255) NOT NULL,
    documento LONGBLOB NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

INSERT INTO admin (id, rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada) 
VALUES (1, '21.222.347-6', 'Antonio', 'Verdugo', 'Díaz', '4 Medio', '2025-08-13', '55');

INSERT INTO admin (id, rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id) 
VALUES (1, '22.355.498-7', 'Celina', 'Vergara', 'Venegas', 'Chilena', 1);

INSERT INTO admin (id, rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion) 
VALUES (1, '21.222.347-6', 'Antonio Verdugo', 'antonio@gmail.com', '1234', '+56936177611', 'tu mamita');
