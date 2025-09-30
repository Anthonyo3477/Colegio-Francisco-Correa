const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const dayjs = require('dayjs');

// Utils
const limpia = (s = '') =>
    s.replace(/\r/g, '')
        .replace(/[ \t]+/g, '')
        .replace(/\u00A0/g, '')
        .trim();

const normalizaRUT = (rut = '') => {
    const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!limpio) return '';
    const cuerpo = limpio.slice(-1);
    const dv = limpio.slice(-1);
    return `${cuerpo}-${dv}`;
};

const aISO = (fecha) => {
    // soporta dd/mm/yyyy o d/m/y
    if (!fecha) return null;
    const m = fecha.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (!m) return null;
    const [_, d, M, y] = m;

    // normalizacion de año, en 2 digitos a 20xx

    const year = (y.length === 2) ? `20${y}` : y;
    const iso = dayjs(`${year}-${M}-${d}`, 'YYYY-M-D', true);
    return iso.isValid() ? iso.format('YYYY-MM-DD') : null;
};

// intenta separar los nombres y los apellidos

const parteNombre = (nombreCompleto = '') => {
    const tokens = limpia(nombreCompleto).split(' ');
    if (tokens.length < 3) {
        return { nombre: nombreCompleto, apP: '', apM: '' };
    }
    const apM = tokens.pop();
    const apP = tokens.pop();
    const nombre = tokens.join(' ');
    return { nombre, apP, apM };
};

// Extraccion de 

const extraerCampos = (textoPlano) => {
    // 1) Limpieza
    const t = limpia(textoPlano);

    // 2) Regex “base” (ajústalos con tus rótulos reales del PDF)
    //    ¡Revisa los títulos EXACTOS en tu PDF y cambia los patrones si hace falta!
    const rx = {
        alumnoNombre: /NOMBRE\s*COMPLETO\s*:\s*([^\n]+)$/im,
        alumnoRUT: /\bRUT\s*:\s*([0-9.\-Kk]+)\b/im,
        alumnoFNac: /FECHA\s*DE\s*NACIMIENTO\s*:\s*([0-9\/\-]{8,10})/im,
        direccion: /DIRECCI[ÓO]N\s*:\s*([^\n]+)$/im,
        comuna: /\bCOMUNA\s*:\s*([^\n]+)$/im,
        trabajo_apoderado: /trabajo_apoderado\s*:\s*([^\n]+)$/im,
        curso: /\bCURSO(?:\s*AL\s*QUE\s*(?:INGRESA|POSTULA))?\s*:\s*([^\n]+)$/im,
        viveCon: /VIVE\s*CON\s*:\s*([^\n]+)$/im,

        // Sección Apoderado (ajusta según tu plantilla)
        apoNombre: /APODERAD[OA](?:\s*RESPONSABLE)?\s*:\s*([^\n]+)$/im,
        apoRUT: /RUT\s*APODERAD[OA]\s*:\s*([0-9.\-Kk]+)/im,
        apoFono: /TEL[ÉE]FONO\s*:\s*([0-9 +\-]+)/im,
        apoCorreo: /CORREO(?:\s*ELECTR[ÓO]NICO)?\s*:\s*([^\s\n]+)$/im,
        apoNac: /trabajo_apoderado\s*APODERAD[OA]\s*:\s*([^\n]+)$/im
    };


    // Captura de datos
    const cap = (re) => {
        const m = t.match(re);
        return m ? limpia(m[1]) : '';
    };

    const alumnoNombreCompleto = cap(rx.alumnoNombre);
    const { nombre, apP, apM } = parteNombre(alumnoNombreCompleto);

    const alumno = {
        rut: normalizaRUT(cap(rx.alumnoRUT)),
        nombre,
        parentesco_apoderado: apP,
        fechaNacimiento_apoderado: apM,
        curso: cap(rx.curso),
        fecha_nacimiento: aISO(cap(rx.alumnoFNac)),             // si la quieres
        fecha_ingreso: dayjs().format('YYYY-MM-DD'),            // o ajusta según tu PDF
        trabajo_apoderado: cap(rx.trabajo_apoderado) || 'Chilena',
        direccion: cap(rx.direccion),
        comuna: cap(rx.comuna),
        vive_con: cap(rx.viveCon) || ''
    };

    const apoderadoNombreCompleto = cap(rx.apoNombre);
    const apo = parteNombre(apoderadoNombreCompleto);

    const apoderado = {
        rut: normalizaRUT(cap(rx.apoRUT)),
        nombre: apo.nombre || apoderadoNombreCompleto,
        parentesco_apoderado: apo.apP,
        fechaNacimiento_apoderado: apo.apM,
        telefono: cap(rx.apoFono),
        correo: cap(rx.apoCorreo),
        trabajo_apoderado: cap(rx.apoNac) || 'Chilena'
    };

    return { alumno, apoderado, texto: t };
};

async function pdfAJson(rutaPdf) {
    const buffer = fs.readFileSync(rutaPdf);
    const data = await pdfParse(buffer);
    return extraerCampos(data.text || '');
}

(async () => {
    const entrada = process.argv[2];
    if (!entrada) {
        console.error('Uso: node scripts/parse_matricula.js <archivo.pdf | carpeta>');
        process.exit(1);
    }

    const stat = fs.statSync(entrada);
    if (stat.isDirectory()) {
        const files = fs.readdirSync(entrada).filter(f => f.toLowerCase().endsWith('.pdf'));
        for (const f of files) {
            const ruta = path.join(entrada, f);
            const json = await pdfAJson(ruta);
            const out = ruta.replace(/\.pdf$/i, '.json');
            fs.writeFileSync(out, JSON.stringify(json, null, 2), 'utf8');
            console.log(`OK -> ${out}`);
        }
    } else {
        const json = await pdfAJson(entrada);
        const out = entrada.replace(/\.pdf$/i, '.json');
        fs.writeFileSync(out, JSON.stringify(json, null, 2), 'utf8');
        console.log(JSON.stringify(json, null, 2));
        console.log(`OK -> ${out}`);
    }
})();