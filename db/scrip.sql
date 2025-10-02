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
    nombreCompleto_alumno VARCHAR(500) NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    rut_alumnos VARCHAR(12) NOT NULL UNIQUE,
    fechaNacimiento_alumno DATE NOT NULL,
    edadAlumno INT NOT NULL,
    puebloOriginario VARCHAR(100),
    quePueblo VARCHAR(100),
    enfermedad VARCHAR(500),
    alergias VARCHAR(500),
    medicamentos VARCHAR(500),
    curso VARCHAR(10) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    añoIngresoChile INT NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    orden_llegada INT UNIQUE NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    comuna VARCHAR(500) NOT NULL,
    viveCon VARCHAR(100) NOT NULL
);

-- Datos socio-académicos
CREATE TABLE datos_academicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ultimo_curso_cursado VARCHAR(100) NOT NULL,
    año_cursado INT NOT NULL,
    colegio_procedencia VARCHAR(100) NOT NULL,
    cursos_reprobados INT NOT NULL,
    beneficios_beca VARCHAR(100) NOT NULL,
    proteccion_infantil VARCHAR(100) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

-- Padre del alumno
CREATE TABLE padre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_padre VARCHAR(100) NOT NULL, 
    rut_padre VARCHAR(12) NOT NULL UNIQUE,
    fechaNacimiento_padre DATE NOT NULL,
    trabajo_apoderado_padre VARCHAR(100) NOT NULL,
    nivelEducacional_padre VARCHAR(100) NOT NULL,
    trabajo_padre VARCHAR(100) NOT NULL,
    correo_padre VARCHAR(350) NOT NULL,
    direccion_padre VARCHAR(500) NOT NULL,
    telefono_padre VARCHAR(15) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

-- Madre del alumno
CREATE TABLE madre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_madre VARCHAR(100) NOT NULL,
    rut_madre VARCHAR(12) NOT NULL UNIQUE,
    fechaNacimiento_madre DATE NOT NULL,
    trabajo_apoderado_madre VARCHAR(100) NOT NULL,
    nivelEducacional_madre VARCHAR(100) NOT NULL,
    trabajo_madre VARCHAR(100) NOT NULL,
    correo_madre VARCHAR(350) NOT NULL,
    direccion_madre VARCHAR(500) NOT NULL,
    telefono_madre VARCHAR(15) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

-- Apoderado principal
CREATE TABLE apoderados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_apoderado VARCHAR(100) NOT NULL,
    parentesco_apoderado VARCHAR(100) NOT NULL,
    rut_apoderado VARCHAR(12) NOT NULL UNIQUE,
    fechaNacimiento_apoderado DATE NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo_apoderado VARCHAR(350) NOT NULL,
    trabajo_apoderado VARCHAR(100) NOT NULL,
    nivelEducacional_apoderado VARCHAR(200) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

-- Apoderado suplente
CREATE TABLE apoderado_suplente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreApoderado_suplente VARCHAR(100) NOT NULL,
    parentescoApoderado_suplente VARCHAR(100) NOT NULL,
    rut_apoderado_suplente VARCHAR(12) NOT NULL UNIQUE,
    fechaNacimiento_apoderado_suplente DATE NOT NULL,
    telefono_suplente VARCHAR(15) NOT NULL,
    correoApoderado_suplente VARCHAR(350) NOT NULL,
    trabajoApoderado_suplente VARCHAR(100) NOT NULL,
    nivelEducacional_apoderado_suplente VARCHAR(200) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

-- Documentos de matrícula
CREATE TABLE matriculas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT UNIQUE,
    nombre_archivo VARCHAR(255) NOT NULL,
    documento LONGBLOB NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);


INSERT INTO alumno (id, rut_alumnos, nombre, parentesco_apoderado, fechaNacimiento_apoderado, curso, fecha_ingreso, trabajo_apoderado, orden_llegada) 
VALUES (1, '21.222.347-6', 'Antonio', 'Verdugo', 'Díaz', '4 Medio', '2025-08-13', '55');

INSERT INTO apoderados (id, rut_apoderado, nombre_apoderado, parentesco_apoderado, fechaNacimiento_apoderado, trabajo_apoderado, alumno_id) 
VALUES (1, '22.355.498-7', 'Celina', 'Vergara', 'Venegas', 'Chilena', 1);

INSERT INTO admin (id, rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion) 
VALUES (1, '21.222.347-6', 'Antonio Verdugo', 'antonio@gmail.com', '1234', '+56936177611', 'tu mamita');
