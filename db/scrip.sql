CREATE DATABASE colegio;

USE colegio;

CREATE TABLE alumno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_alumnos VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    curso VARCHAR(10) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    orden_llegada INT UNIQUE
);

CREATE TABLE apoderados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_apoderado VARCHAR(12) NOT NULL UNIQUE,
    nombre_apoderado VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    alumno_id INT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE
);

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_admin VARCHAR(12) NOT NULL UNIQUE,
    nombre_admin VARCHAR(100) NOT NULL,
    correo_admin VARCHAR(100) NOT NULL UNIQUE,
    contrasena_admin VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    direccion VARCHAR(255) NOT NULL
);