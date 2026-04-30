//////////////////////////////////
//VariablesConfigurables.js
/////////////////////////////////
const EXAM_NAME = "Exámen final de Fundamentos de TI - TCS1003";
document.getElementById("title").textContent = EXAM_NAME;
const EXAM_DURATION_MINUTES = 165; //165 Cambiar a 180 u otro valor si se desea
const EXAM_STORAGE_KEY = "examData"; //Variable para guardar datos en el localStorage
const EXAM_STATE_KEY = "examState"; //Variable para reanudar el examen donde estaba
const ADMIN_PASSWORD = "Shoudymella1986*"; //Contraseña para borrar los datos de la página con Ctrl + Alt + P
const MAX_CLEAR_USES = 1; // Cambia a 2 o 3 si deseas permitir más usos
const CLEAR_INTERVAL_DAYS = 1; // Tiempo en días de espera para poder borrar los datos

const MAX_ATTEMPTS = 3; // Intentos
const UNIQUE_QUESTIONS_COUNT = 23; // 23 Selección única 1puntos = 23pts
const UNIQUE_QUESTIONS_VALUE = "1 PTS";
const DEVELOPMENT_QUESTIONS_COUNT = 15; // 15x2 = 30pts
const DEVELOPMENT_QUESTIONS_VALUE = "2 PTS"; 
const PRACTICE_QUESTIONS_PAREO = 14; // 14x0.5 = 7pts
                        //Crucigrama // 11x3 = 33pts
const PRACTICE_QUESTIONS_SOUP = 14; // 14.0.5 7pts
const ACCESS_CODE = "ExamenDeLaProstata"; // 12345 Código que se valida en script.js
/////////////////////////////////

//////////////////////////////////
//VerificaCambioDeCodigo.js
//////////////////////////
(function () {
    const examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY));
    if (examData?.accessCode && examData.accessCode !== ACCESS_CODE) {
        localStorage.removeItem(EXAM_STORAGE_KEY);
        localStorage.removeItem(EXAM_STATE_KEY);
        localStorage.removeItem("examStarted");
        localStorage.removeItem("examEndTime");
        localStorage.removeItem("uniqueQuestionsRandomizadas");
        localStorage.removeItem("studentAnswers");
        localStorage.removeItem("currentQuestionIndex");
        localStorage.removeItem("parte1Finalizada");
        localStorage.removeItem("parte2Finalizada");
        localStorage.removeItem("currentEssayIndex");
        localStorage.removeItem("aceptoInstruccionesExamen");
        localStorage.removeItem("practiceData");
        localStorage.removeItem("questionTimes");
        localStorage.removeItem("paginaRecargada"); // Remover el flag de recarga
        localStorage.removeItem("pantallaFinalizadaActiva"); // Remover estado de pantalla finalizada
        localStorage.removeItem("pdfDescargado"); // Remover marca de PDF descargado
        localStorage.removeItem("preguntasDesarrolloSeleccionadas"); // Remover preguntas guardadas
        localStorage.setItem("codigoCambiado", "true"); // Marcar que el código cambió
    }
    // Si el código cambió, inicia objeto vacío
    const newExamData = (examData?.accessCode !== ACCESS_CODE) ? {} : (examData || {});
    newExamData.accessCode = ACCESS_CODE;
    // Elimina las instrucciones aceptadas si el código cambió
    if (examData?.accessCode !== ACCESS_CODE) {
        delete newExamData.instruccionesAceptadas;
        delete newExamData.fechaAceptacion;
        delete newExamData.respuestasDesarrollo;
        delete newExamData.respuestasSeleccionUnica;
        delete newExamData.respuestasPractica;
    }
    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(newExamData));
})();
///////////////////////////////////////

//////////////////////////////////
//Main_Intentos.js
/////////////////////////////////
//VARIABLES GLOBALES
let intentoYaRestado = false; // Para evitar que se reste más de una vez
let devtoolsAbierto = false;
let devtoolsYaDetectado = false;

// VARIABLES PARA TRACKING DE TIEMPO
let questionStartTime = null;
let questionTimes = {};

// GESTIÓN DE INTENTOS
function obtenerIntentosRestantes() {
    const data = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY));
    return data?.intentosRestantes ?? MAX_ATTEMPTS;
}

function restarIntentoYGuardar() {
    if (intentoYaRestado) return;

    let data = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || { intentosRestantes: MAX_ATTEMPTS };
    data.intentosRestantes = Math.max(0, (data.intentosRestantes ?? MAX_ATTEMPTS) - 1);
    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(data));

    // Sincronizar con examData para el PDF
    let examData = JSON.parse(localStorage.getItem("examData")) || {};
    examData.intentosRestantes = data.intentosRestantes;
    localStorage.setItem("examData", JSON.stringify(examData));

    intentoYaRestado = true;
}

function verificarIntentos() {
    const intentosRestantes = obtenerIntentosRestantes();
    if (intentosRestantes <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Exámen bloqueado',
            text: 'Has agotado todos tus intentos.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem("practicaFinalizada", "true");
                mostrarPantallaFinalizada();
            }
        });
    }
}

function mostrarIntentosRestantes() {
    const data = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || { intentosRestantes: MAX_ATTEMPTS };
    const restantes = data.intentosRestantes ?? MAX_ATTEMPTS;
    const span = document.getElementById("intentos-restantes");

    if (!span) return;

    span.textContent = restantes;

    if (restantes === 2) {
        span.style.color = "orange";
    } else if (restantes === 1) {
        span.style.color = "red";
    } else if (restantes === 0) {
        span.style.color = "gray";
    } else {
        span.style.color = "green";
    }
}

function actualizarAccesoPorIntentos() {
    const restantes = obtenerIntentosRestantes();
    const accessSection = document.getElementById("access-section");
    const accessContent = document.getElementById("access-content");
    const noAttemptsContent = document.getElementById("no-attempts-content");

    if (!accessSection) return;

    if (restantes <= 0) {
        accessSection.classList.add("no-attempts");
        accessContent.style.display = "none";
        noAttemptsContent.style.display = "block";
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "none";
    } else {
        accessSection.classList.remove("no-attempts");
        accessContent.style.display = "block";
        noAttemptsContent.style.display = "none";
    }
}

function controlarAccesoPorIntentos() {
    const restantes = obtenerIntentosRestantes();
    const inputCodigo = document.getElementById("accessInput");
    const instrucciones = document.getElementById("toggleInstructionsBtn");
    const btnIngresar = inputCodigo?.nextElementSibling;

    if (restantes <= 0) {
        if (inputCodigo) inputCodigo.disabled = true;
        if (btnIngresar) btnIngresar.disabled = true;
        if (instrucciones) instrucciones.disabled = true;
    } else {
        if (inputCodigo) inputCodigo.disabled = false;
        if (btnIngresar) btnIngresar.disabled = false;
        if (instrucciones) instrucciones.disabled = false;
    }
}

// CONTROL UNIFICADO DE SALIDA / TRAMPA
function manejarSalidaExamen(tipo, evento = null) {
    if (intentoYaRestado) return;

    restarIntentoYGuardar();
    mostrarIntentosRestantes();
    localStorage.setItem(EXAM_STATE_KEY, "perdido");

    if (tipo === "recarga" && evento) {
        const msg = "Si recarga o sale, perderá un intento.";
        evento.preventDefault();
        evento.returnValue = msg;
        return msg;
    }

    if (tipo === "cambioPestania") {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Has salido del exámen. Perdiste un intento.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => location.reload());
    }

    if (tipo === "devtools") {
        Swal.fire({
            icon: 'error',
            title: 'Acción no permitida',
            text: 'Se detectó manipulación (DevTools). Has perdido un intento.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => location.reload());
    }
}

window.addEventListener("beforeunload", function (e) {
    // Si está en pantalla finalizada Y ya descargó el PDF, no restar intento
    if (localStorage.getItem("pantallaFinalizadaActiva") === "true" && localStorage.getItem("pdfDescargado") === "true") {
        return;
    }
    // Marcar que se va a recargar para detectarlo después
    localStorage.setItem("paginaRecargada", "true");
    manejarSalidaExamen("recarga", e);
});

document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        manejarSalidaExamen("cambioPestania");
    }
});


// DETECCIÓN CONFIABLE DE DEVTOOLS
function detectarDevtoolsConTiempo() {
    const umbral = 100; // milisegundos

    const antes = new Date();
    Function('debugger')(); // Ejecuta sin mostrar nada
    const despues = new Date();

    const diferencia = despues - antes;

    if (diferencia > umbral && !devtoolsYaDetectado) {
        devtoolsYaDetectado = true;

        Swal.fire({
            icon: 'error',
            title: 'DevTools detectado',
            html: `
                <p>Has abierto las herramientas de desarrollo (DevTools).</p>
                <p><strong>Se perderá un intento</strong> por esta acción.</p>
            `,
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => {
            manejarSalidaExamen("devtools"); // restar intento
            location.reload(); // recarga para bloquear el intento
        });
    }
}

// Llamar la detección cada 1.5 segundos
setInterval(detectarDevtoolsConTiempo, 1500);


// MOSTRAR/OCULTAR INSTRUCCIONES
const btn = document.getElementById("toggleInstructionsBtn");
const instructions = document.getElementById("instruction");
instructions.style.display = "none";

btn?.addEventListener("click", () => {
    if (instructions.style.display === "none") {
        instructions.style.display = "block";
        btn.innerText = "Ocultar Instrucciones";
    } else {
        instructions.style.display = "none";
        btn.innerText = "Ver Instrucciones";
    }
});

document.addEventListener("click", function (e) {
    const isInside = instructions.contains(e.target) || btn.contains(e.target);
    if (!isInside && instructions.style.display === "block") {
        Swal.fire({
            icon: 'info',
            title: 'Instrucciones ocultas',
            text: 'Se han ocultado automáticamente al interactuar fuera.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        });
        instructions.style.display = "none";
        btn.innerText = "Ver Instrucciones";
    }
});

// CHECKBOX DE CONSENTIMIENTO
document.addEventListener("DOMContentLoaded", function () {
    const checkbox = document.getElementById("agreeCheck");
    if (!checkbox) return;

    // --- Aquí agrego código para cargar el estado guardado ---
    let estado = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    if (estado.instruccionesAceptadas) {
        checkbox.checked = true;
        checkbox.disabled = true;
        instructions.style.display = "none";
        btn.innerText = "Ver Instrucciones";
    }

    // Evento para guardar cuando el usuario acepte
    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            Swal.fire({
                icon: 'info',
                title: 'Consentimiento registrado',
                text: 'Aceptaste las instrucciones. No se puede deshacer.',
                confirmButtonText: 'Aceptar',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            }).then((result) => {
                if (result.isConfirmed || result.dismiss) {
                    checkbox.disabled = true;
                    instructions.style.display = "none";
                    btn.innerText = "Ver Instrucciones";

                    // **Se añde esto para que se guarde en el localStorage**
                    let estado = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
                    estado.instruccionesAceptadas = true;
                    estado.fechaAceptacion = new Date().toISOString();
                    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(estado));
                } else {
                    checkbox.checked = false;
                }
            });
        } else {
            checkbox.checked = true;
        }
    });
});

// BOTÓN SECRETO PARA ADMINISTRADOR
window.addEventListener("DOMContentLoaded", () => {
    const adminBtn = document.getElementById("admin-clear");
    adminBtn.style.display = "none";

    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.altKey && e.code === "KeyP") {
            const usedCount = parseInt(localStorage.getItem("clearButtonUses") || "0", 10);
            if (usedCount < MAX_CLEAR_USES) {
                adminBtn.style.display = "block";
            }
        }
    });

    adminBtn.addEventListener("click", () => {
        const lastClearDateStr = localStorage.getItem("lastClearDate");
        const now = new Date();

        if (lastClearDateStr) {
            const lastClearDate = new Date(lastClearDateStr);
            const diffTime = now - lastClearDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays < 2) {
                Swal.fire({
                    icon: "info",
                    title: "Espera requerida",
                    text: "Este botón solo se puede usar cada 2 días.",
                    confirmButtonText: 'Aceptar',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    customClass: {
                        popup: 'swal-instrucciones',
                        title: 'swal-instrucciones-title',
                        confirmButton: 'swal-instrucciones-confirm',
                        icon: 'swal-instrucciones-icon',
                        htmlContainer: 'swal-instrucciones-text'
                    },
                    didOpen: () => {
                        const popup = document.querySelector('swal-instrucciones');
                        if (popup) {
                            popup.scrollTop = 0; // Forzar scroll arriba
                        }
                    }
                });
                return;
            }
        }

        Swal.fire({
            title: "Confirmación",
            input: "password",
            inputLabel: "Ingrese su clave de administrador",
            inputPlaceholder: "Contraseña",
            showCancelButton: true,
            confirmButtonText: "Borrar todo",
            cancelButtonText: "Cancelar",
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                input: 'swal-instrucciones-input',
                confirmButton: 'swal-instrucciones-confirm',
                cancelButton: 'swal-instrucciones-cancel',
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            },

            preConfirm: (password) => {
                if (password !== ADMIN_PASSWORD) {
                    Swal.showValidationMessage("❌ Contraseña incorrecta");
                }
                return password === ADMIN_PASSWORD;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                localStorage.setItem("lastClearDate", now.toISOString());
                let usedCount = parseInt(localStorage.getItem("clearButtonUses") || "0", 10);
                usedCount++;
                localStorage.setItem("clearButtonUses", usedCount.toString());
                localStorage.removeItem("pantallaFinalizadaActiva"); // Asegurar que se limpia
                localStorage.removeItem("pdfDescargado"); // Asegurar que se limpia
                adminBtn.style.display = "none";

                Swal.fire({
                    icon: "success",
                    title: "Datos borrados",
                    text: "Todo el progreso del exámen fue eliminado.",
                    confirmButtonText: 'Entendido',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    customClass: {
                        popup: 'swal-instrucciones',
                        title: 'swal-instrucciones-title',
                        confirmButton: 'swal-instrucciones-confirm',
                    },
                    didOpen: () => {
                        const popup = document.querySelector('swal-instrucciones');
                        if (popup) {
                            popup.scrollTop = 0; // Forzar scroll arriba
                        }
                    }
                }).then(() => location.reload());
            }
        });
    });
});

// INICIALIZACIÓN
window.onload = function () {
    // Detectar si el código cambió y mostrar instrucciones importantes
    if (localStorage.getItem("codigoCambiado") === "true") {
        localStorage.removeItem("codigoCambiado");
        mostrarInstruccionesImportantes();
    }
    // Detectar si hubo recarga y mostrar mensaje
    else if (localStorage.getItem("paginaRecargada") === "true") {
        localStorage.removeItem("paginaRecargada");
        document.getElementById("name-section").style.display = "none";
        Swal.fire({
            icon: 'warning',
            title: 'Página recargada',
            text: 'Has recargado la página. Perdiste un intento.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        });
    }

    verificarIntentos();
    mostrarIntentosRestantes();
    actualizarAccesoPorIntentos();
    controlarAccesoPorIntentos();

    // Sincronizar intentos con examData
    const intentosActuales = obtenerIntentosRestantes();
    let examData = JSON.parse(localStorage.getItem("examData")) || {};
    examData.intentosRestantes = intentosActuales;
    localStorage.setItem("examData", JSON.stringify(examData));

    // Agregar event listeners
    setupEventListeners();
};

// FUNCIÓN PARA SCROLL HACIA ARRIBA
function scrollToTop() {
    setTimeout(() => {
        // Múltiples métodos para máxima compatibilidad
        window.scrollTo({ top: 0 });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Para dispositivos móviles iOS/Android
        const scrollableElement = document.scrollingElement || document.documentElement;
        scrollableElement.scrollTop = 0;

        // Método adicional para móviles
        if (window.pageYOffset !== undefined) {
            try {
                window.scroll(0, 0);
            } catch (e) {
                // Fallback silencioso
            }
        }
    }, 150);
}

// CONFIGURACIÓN DE EVENT LISTENERS
function setupEventListeners() {
    // Botón ingresar
    const btnIngresar = document.getElementById("btnIngresar");
    if (btnIngresar) {
        btnIngresar.addEventListener("click", validateAccess);
    }

    // Botón reset admin
    const adminResetBtn = document.getElementById("adminResetBtn");
    if (adminResetBtn) {
        adminResetBtn.addEventListener("click", resetAccess);
    }

    // Menú hamburguesa
    const navBar = document.getElementById("nav-bar");
    if (navBar) {
        navBar.addEventListener("click", showHideMenu);
    }

    // Botón siguiente selección única
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
        nextBtn.addEventListener("click", function () {
            nextQuestion();
            scrollToTop();
            window.scrollTo(top, 0); // Asegurar que se suba al inicio
        });
    }

    // Botón siguiente desarrollo
    const nextBtnDesarrollo = document.getElementById("nextBtnDesarrollo");
    if (nextBtnDesarrollo) {
        nextBtnDesarrollo.addEventListener("click", function () {
            nextQuestion();
            scrollToTop();
            window.scrollTo(top, 0);
        });
    }

    // Botones práctica
    const btnSiguientePractica1 = document.getElementById("btnSiguientePractica1");
    if (btnSiguientePractica1) {
        btnSiguientePractica1.addEventListener("click", function () {
            nextPracticeSection();
            scrollToTop();
            window.scrollTo(top, 0);
        });
    }

    const btnSiguientePractica2 = document.getElementById("btnSiguientePractica2");
    if (btnSiguientePractica2) {
        btnSiguientePractica2.addEventListener("click", function () {
            nextPracticeSection();
            scrollToTop();
            window.scrollTo(top, 0);
        });
    }

    const btnFinalizarPractica = document.getElementById("btnFinalizarPractica");
    if (btnFinalizarPractica) {
        btnFinalizarPractica.addEventListener("click", function () {
            finalizarPractica();
            scrollToTop();
            window.scrollTo(top, 0);
        });
    }

    // Botón descargar final
    const btnDescargarFinal = document.getElementById("btnDescargarFinal");
    if (btnDescargarFinal) {
        btnDescargarFinal.addEventListener("click", function () {
            // Marcar que el PDF se descargó
            localStorage.setItem("pdfDescargado", "true");
            document.getElementById('btnGenerarPDF').click();
        });
    }

    // Botón generar PDF del menú
    const btnGenerarPDF = document.getElementById("btnGenerarPDF");
    if (btnGenerarPDF) {
        btnGenerarPDF.addEventListener("click", function () {
            // Marcar que el PDF se descargó
            localStorage.setItem("pdfDescargado", "true");
        });
    }
}

// Función para mostrar instrucciones importantes
function mostrarInstruccionesImportantes() {
    Swal.fire({
        title: 'Instrucciones importantes',
        html: `
      <p>Este exámen es individual y debe completarse sin ayuda.</p>
      <br>
      <ul style="text-align:left;">
        <li>Por favor lea las instrucciones generales detenidamente</li>
        <li>No recargue la página</li>
        <li>No cambie de pestaña o ventana</li>
        <li>Evite cerrar el navegador</li>
        <li>El código de acceso debe consultarlo al docente del curso, es para iniciar su exámen</li>
      </ul>
      <br>
      <b>¿Esta de acuerdo?</b>
    `,
        position: 'top',
        imageUrl: 'images/question.png',
        confirmButtonText: 'Sí estoy de acuerdo',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'swal-instrucciones',
            title: 'swal-instrucciones-title',
            confirmButton: 'swal-instrucciones-confirm',
            cancelButton: 'swal-instrucciones-cancel',
            icon: 'swal-instrucciones-icon',
            htmlContainer: 'swal-instrucciones-text',
            image: 'swal-instrucciones-image'
        },
        didOpen: () => {
            const popup = document.querySelector('swal-instrucciones');
            if (popup) {
                popup.scrollTop = 0; // Forzar scroll arriba
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log("Usuario aceptó estas instrucciones");
        } else if (result.isDismissed) {
            // El usuario presionó cancelar o cerró el cuadro
            //window.location.href = "https://www.google.com";
        }
    });
}


//Para que no lo vuelva a pedir el código a menos que sea necesario
window.addEventListener("DOMContentLoaded", function () {
    const examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    const intentosRestantes = examData.intentosRestantes ?? MAX_ATTEMPTS;

    if (localStorage.getItem("parte2Finalizada") === "true") {
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "none";
        document.getElementById("practice").style.display = "block";
        initPracticePart();
        // Recuperar la sección actual guardada
        const savedData = JSON.parse(localStorage.getItem("practiceData")) || {};
        const currentSection = savedData.currentSection || 1;
        showPracticeSection(currentSection);
        updatePracticeProgress();
    } else if (localStorage.getItem("parte1Finalizada") === "true") {
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "block";
        document.getElementById("practice").style.display = "none";

        // Recupera el índice guardado o empieza en 0 si no existe
        const savedEssayIndex = localStorage.getItem("currentEssayIndex");
        indiceDesarrollo = savedEssayIndex !== null ? parseInt(savedEssayIndex, 10) : 0;

        mostrarPreguntaDesarrollo(indiceDesarrollo);
        cargarPanelLateralDesarrollo();
    } else {
        document.getElementById("uniqueSelection").style.display = "block";
        document.getElementById("essay").style.display = "none";
        document.getElementById("practice").style.display = "none";
    }

    // Si no hay intentos, muestra solo el acceso bloqueado
    if (intentosRestantes <= 0) {
        document.getElementById("access-section").style.display = "block";
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "none";
        return;
    }

    // Verificar si está en pantalla finalizada
    if (localStorage.getItem("pantallaFinalizadaActiva") === "true") {
        document.getElementById("access-section").style.display = "none";
        document.getElementById("name-section").style.display = "none";
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "none";
        document.getElementById("practice").style.display = "none";
        document.getElementById("mostrarPantallaFinalizada").style.display = "block";
        return;
    }

    // Si ya validó datos y aceptó instrucciones, muestra la parte correspondiente
    if (examData.nombre && examData.cedula && examData.instruccionesAceptadas) {
        document.getElementById("access-section").style.display = "none";
        document.getElementById("name-section").style.display = "block";
        document.getElementById("nav-bar").style.display = "block"; // Mostrar menú hamburguesa
        document.getElementById("begin-timer").style.display = "block"; // Mostrar timer

        // Reiniciar el timer si es necesario
        if (localStorage.getItem("examStarted") === "true") {
            startTimer();
        }

        if (localStorage.getItem("parte2Finalizada") === "true") {
            document.getElementById("uniqueSelection").style.display = "none";
            document.getElementById("essay").style.display = "none";
            document.getElementById("practice").style.display = "block";
            initPracticePart();
            // Recuperar la sección actual guardada
            const savedData = JSON.parse(localStorage.getItem("practiceData")) || {};
            const currentSection = savedData.currentSection || 1;
            showPracticeSection(currentSection);
            updatePracticeProgress();
        } else if (localStorage.getItem("parte1Finalizada") === "true") {
            document.getElementById("uniqueSelection").style.display = "none";
            document.getElementById("essay").style.display = "block";
            document.getElementById("practice").style.display = "none";
            // Solo inicializar preguntas aleatorias si no existen
            const savedQuestions = localStorage.getItem("preguntasDesarrolloSeleccionadas");
            if (!savedQuestions) {
                preguntasDesarrollo = getRandomDevelopmentQuestions();
                localStorage.setItem("preguntasDesarrolloSeleccionadas", JSON.stringify(preguntasDesarrollo));
            } else {
                preguntasDesarrollo = JSON.parse(savedQuestions);
            }
            const savedEssayIndex = localStorage.getItem("currentEssayIndex");
            indiceDesarrollo = savedEssayIndex !== null ? parseInt(savedEssayIndex, 10) : 0;
            mostrarPreguntaDesarrollo(indiceDesarrollo);
            cargarPanelLateralDesarrollo();
        } else {
            document.getElementById("uniqueSelection").style.display = "block";
            document.getElementById("essay").style.display = "none";
            document.getElementById("practice").style.display = "none";
            initUniqueSelection(); //Para que cargue
            renderProgressBar();
        }
    } else {
        // Si no ha validado datos, muestra el acceso
        document.getElementById("access-section").style.display = "block";
        document.getElementById("name-section").style.display = "none";
        document.getElementById("uniqueSelection").style.display = "none";
        document.getElementById("essay").style.display = "none";
        document.getElementById("practice").style.display = "none";
    }
});
///////////////////////////////////////


//////////////////////////////////
//Seguridad.js
/////////////////////////////////
//BLOQUEO DE FUNCIONES NO PERMITIDAS
let seguridadActiva = true;

// Función de bloqueo de combinaciones peligrosas
document.addEventListener("keydown", function (e) {
    if (!seguridadActiva) return;

    const key = (e.key || "").toLowerCase();
    const bloqueado =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && key === "i") ||   // DevTools
        (e.ctrlKey && key === "u") ||                 // Ver código fuente
        (e.ctrlKey && key === "s") ||                 // Guardar página
        (e.ctrlKey && key === "p") ||                 // Imprimir 
        (e.ctrlKey && key === "v") ||                 // Pegar     
        (e.ctrlKey && key === "c");                   // Copiar
    if (bloqueado) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

// Bloquear clic derecho
document.addEventListener("contextmenu", function (e) {
    if (seguridadActiva) {
        e.preventDefault();
    }
});

// Detección de DevTools
let devToolsDetected = false;
function detectDevTools() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
        if (!devToolsDetected) {
            devToolsDetected = true;
            const examData = JSON.parse(localStorage.getItem("examData")) || {};
            examData.dtStatus = true;
            localStorage.setItem("examData", JSON.stringify(examData));
        }
    }
}

// Verificar DevTools cada 500ms
setInterval(detectDevTools, 500);
window.addEventListener('load', detectDevTools);
window.addEventListener('resize', detectDevTools);

// Detección de cambio de pestaña
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        const examData = JSON.parse(localStorage.getItem("examData")) || {};
        examData.tabSwitched = true;
        localStorage.setItem("examData", JSON.stringify(examData));
    }
});
////////////////////////////////////

//////////////////////////////////
//ValidarAcceso.js
/////////////////////////////////
function validateAccess() {
    const inputCode = document.getElementById("accessInput").value.trim();
    const checkbox = document.getElementById("agreeCheck");

    if (!checkbox.checked || !checkbox.disabled) {
        Swal.fire({
            icon: 'warning',
            title: 'Debe aceptar las instrucciones',
            text: 'Por favor lea y acepte las instrucciones antes de comenzar el exámen.',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        });
        return; // Detiene la ejecución
    }

    if (inputCode === ACCESS_CODE) {
        Swal.fire({
            title: '¡Recuerde!',
            html: `                
                <ul style="text-align:left;">
                    <li>Le doy mis mejores deseos en la evaluación.</li>
                    <li>No recargue la página.</li>
                    <li>No cambie de pestaña o ventana.</li>
                    <li>Evite cerrar el navegador.</li>
                    <br>
                    <li><Strong>Si no cumple con esto el exámen podría anularse</Strong></li>
                </ul>
                <br>
                <ul style="text-align:left;">
                    <li><b>¡"Porque Jehová da la sabiduría, y de su boca viene el conocimiento y la inteligencia."</b></li>
                </ul>
                <ul style="text-align:right;">
                    <li><b>¡Proverbios 2:6!</b></li>
                </ul>
                `,
            position: 'top',
            imageUrl: 'images/BestWishes.png',
            confirmButtonText: 'Sí estoy de acuerdo',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                cancelButton: 'swal-instrucciones-cancel',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text',
                image: 'swal-instrucciones-image'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Ocultar sección de acceso
                document.getElementById("access-section").style.display = "none";

                // Marcar que el exámen empezó
                localStorage.setItem("examStarted", "true");

                // Mostrar elementos del exámen
                startTimer();
                // document.getElementById("nav-bar").style.display = "block";
                document.getElementById("begin-timer").style.display = "block";
                document.getElementById("name-section").style.display = "block";

                // Mostrar mensaje de bienvenida al exámen
                setTimeout(() => {
                    Swal.fire({
                        icon: 'info',
                        title: 'Bienvenido al Exámen',
                        text: 'Complete sus datos personales y luego podrá comenzar con la Parte 1: Selección Única.',
                        confirmButtonText: 'Entendido',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        customClass: {
                            popup: 'swal-instrucciones',
                            title: 'swal-instrucciones-title',
                            confirmButton: 'swal-instrucciones-confirm',
                            icon: 'swal-instrucciones-icon',
                            htmlContainer: 'swal-instrucciones-text'
                        },
                        didOpen: () => {
                            const popup = document.querySelector('swal-instrucciones');
                            if (popup) {
                                popup.scrollTop = 0; // Forzar scroll arriba
                            }
                        }
                    });
                }, 500);
            } else if (result.isDismissed) {
                // El usuario presionó cancelar o cerró el cuadro
                window.location.href = "https://www.google.com";
            }
        });
    } else {
        document.getElementById("accessError").style.display = "block";
    }
}

function resetAccess() {
    console.log("Reset access function called");
}
////////////////////////////////////////

//////////////////////////////////
//VerInstrucciones.js
/////////////////////////////////
const btnAcceptInstructions = document.getElementById("toggleInstructionsBtn");
const panelInstructions = document.getElementById("instruction");
const agreeKey = "aceptoInstruccionesExamen"; // clave para localStorage

panelInstructions.style.display = "none";

btnAcceptInstructions.addEventListener("click", () => {
    if (panelInstructions.style.display === "none") {
        panelInstructions.style.display = "block";
        btnAcceptInstructions.innerText = "Ocultar Instrucciones";
    } else {
        panelInstructions.style.display = "none";
        btnAcceptInstructions.innerText = "Ver Instrucciones";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const checkbox = document.getElementById("agreeCheck");

    // Cargar estado previo del checkbox
    const aceptadoPrevio = localStorage.getItem(agreeKey);
    if (aceptadoPrevio === "true") {
        checkbox.checked = true;
        checkbox.disabled = true;
        panelInstructions.style.display = "none";
        btnAcceptInstructions.innerText = "Ver Instrucciones";
    }

    // Al marcar el checkbox
    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            Swal.fire({
                icon: 'info',
                title: 'Consentimiento registrado',
                text: 'Usted va a aceptar las instrucciones del exámen cuando de clic en el botón. Esta acción no se puede deshacer.',
                confirmButtonText: 'Aceptar',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                    panelInstructions.style.display = "none";
                    btnAcceptInstructions.innerText = "Ver Instrucciones";

                    // Guardar estado en localStorage
                    localStorage.setItem(agreeKey, "true");
                    let examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
                    examData.instruccionesAceptadas = true;
                    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(examData));
                } else {
                    checkbox.checked = false;
                    Swal.fire({
                        icon: 'warning',
                        title: 'Instrucciones no aceptadas',
                        text: 'No se han aceptado las instrucciones y para poder iniciar el exámen es necesario aceptarlas dando clic en el botón llamado: "Aceptar".',
                        confirmButtonText: 'Entendido',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        customClass: {
                            popup: 'swal-instrucciones',
                            title: 'swal-instrucciones-title',
                            confirmButton: 'swal-instrucciones-confirm',
                            icon: 'swal-instrucciones-icon',
                            htmlContainer: 'swal-instrucciones-text'
                        },
                        didOpen: () => {
                            const popup = document.querySelector('swal-instrucciones');
                            if (popup) {
                                popup.scrollTop = 0; // Forzar scroll arriba
                            }
                        }
                    });
                }
            });
        } else {
            // No permitir desmarcar después de aceptar
            if (checkbox.disabled) {
                checkbox.checked = true;
            }
        }
    });

    // Cerrar instrucciones si clic fuera del panel y botón, solo si NO ha aceptado
    document.addEventListener("click", function (event) {
        const target = event.target;

        if (
            panelInstructions.style.display === "block" &&
            !panelInstructions.contains(target) &&
            !btnAcceptInstructions.contains(target) &&
            !checkbox.disabled // solo si NO está aceptado
        ) {
            panelInstructions.style.display = "none";
            btnAcceptInstructions.innerText = "Ver Instrucciones";

            Swal.fire({
                icon: 'warning',
                title: 'Instrucciones no aceptadas',
                text: 'No se han aceptado las instrucciones y para poder iniciar el exámen es necesario aceptarlas.',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            });
        }
    });
});

// Lógica del botón toggle fuera de DOMContentLoaded para que funcione sin retraso
btnAcceptInstructions.addEventListener("click", () => {
    if (panelInstructions.style.display === "none") {
        panelInstructions.style.display = "block";
        btnAcceptInstructions.innerText = "Ocultar Instrucciones";
    } else {
        panelInstructions.style.display = "none";
        btnAcceptInstructions.innerText = "Ver Instrucciones";
    }
});
/////////////////////////////////

//////////////////////////////////
//IniciarCuentaRegresiva.js
/////////////////////////////////
let timerInterval;
function startTimer() {
    if (localStorage.getItem("examStarted") !== "true") {
        return;
    }

    // Verifica si ya existe endTime guardado
    let endTime = localStorage.getItem("examEndTime");

    if (!endTime) {
        endTime = Date.now() + EXAM_DURATION_MINUTES * 60 * 1000;
        localStorage.setItem("examEndTime", endTime);
    } else {
        endTime = parseInt(endTime, 10);
    }

    timerInterval = setInterval(() => {
        const remaining = endTime - Date.now();

        if (remaining <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timer").textContent = "Tiempo terminado temporizador";
            localStorage.removeItem("examEndTime");
            finishExam();
        } else {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            document.getElementById("timer").textContent =
                `Tiempo restante temporizador: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function finishExam() {
    localStorage.removeItem("examEndTime");
    localStorage.removeItem("examStarted");
    clearInterval(timerInterval);
    // Aquí continúa el proceso normal de cierre del exámen
    Swal.fire({
        icon: 'info',
        title: 'Exámen finalizado',
        text: 'Tu temporizador ha terminado.',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'swal-instrucciones',
            title: 'swal-instrucciones-title',
            confirmButton: 'swal-instrucciones-confirm',
            icon: 'swal-instrucciones-icon',
            htmlContainer: 'swal-instrucciones-text'
        },
        didOpen: () => {
            const popup = document.querySelector('swal-instrucciones');
            if (popup) {
                popup.scrollTop = 0; // Forzar scroll arriba
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem("practicaFinalizada", "true");
            mostrarPantallaFinalizada();
        }
    });
}
////////////////////////////////////

//////////////////////////////////
//MostrarFechaActual.js
/////////////////////////////////
const dateElement = document.getElementById("dateDisplay");
const now = new Date();
const formattedDate = now.toLocaleDateString("es-CR", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
});
dateElement.textContent = `Fecha: ${formattedDate}`;
////////////////////////////////////////

//////////////////////////////////
//PreguntasDesarrollo.js
/////////////////////////////////
const preguntasDesarrolloCompletas = [
    `Explica con tus palabras qué es un driver y por qué es esencial para el funcionamiento de una computadora. Menciona dos consecuencias de no tenerlos actualizados. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Menciona y describe tres tipos de drivers, dando un ejemplo concreto de cada uno. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Explica tres problemas que pueden surgir por no actualizar los drivers de una computadora y como afectan al usuario. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Detalla el proceso para instalar un driver en Windows desde tres fuentes diferentes (sitio web oficial, Windows Update, y disco/USB del fabricante) ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `¿Por qué es importante mantener el software y los drivers actualizados en términos de seguridad informática? Da dos ejemplos de amenazas que pueden evitarse. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Define malware y menciona cuatro tipos distintos, explicando brevemente cómo afecta cada uno al usuario o sistema. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Enumera tres medidas de seguridad que tomarías antes de abrir archivos de un USB desconocido. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Explica qué es el phishing y menciona tres señales para identificar un correo sospechoso. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Describe el papel del firewall en la seguridad informática y de un ejemplo de cómo protege una red doméstica en la actualidad. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `¿Qué es una pantalla azul de la muerte (BSOD) y cómo puede estar relacionada con los drivers? Explica dos causas posibles. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Menciona por qué debemos protegernos como usuarios de las amenazas de malware, y cuales serían 3 tipos de soluciones. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `Como usuario, ¿Como puedo configurar mi navegador web, para que sea más seguro y evitar que violen mi privacidad?. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `¿Para que sirve el archivo Hosts en nuetro sistema operativo? explique. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `¿Que es nslookup y donde se usa?. ${DEVELOPMENT_QUESTIONS_VALUE}`,
    `¿Qué es y para que sirve la dirección 127.0.0.1 y por qué se usa en el archivo Hosts?. ${DEVELOPMENT_QUESTIONS_VALUE}`,
];

// Función para seleccionar preguntas únicas aleatorias 
function getRandomDevelopmentQuestions() {
    // Crear una copia del array original
    const available = [...preguntasDesarrolloCompletas];
    const selected = [];

    // Seleccionar preguntas según la variable DEVELOPMENT_QUESTIONS_COUNT aleatoriamente
    for (let i = 0; i < DEVELOPMENT_QUESTIONS_COUNT && available.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        selected.push(available[randomIndex]);
        available.splice(randomIndex, 1); // Remover la pregunta seleccionada
    }
    return selected;
}

let preguntasDesarrollo = [];
let indiceDesarrollo = 0;
function initDevelopmentPart() {
    loadQuestionTimes(); // Cargar tiempos guardados

    // Verificar si ya hay preguntas seleccionadas guardadas
    const savedQuestions = localStorage.getItem("preguntasDesarrolloSeleccionadas");
    if (savedQuestions) {
        preguntasDesarrollo = JSON.parse(savedQuestions);
    } else {
        preguntasDesarrollo = getRandomDevelopmentQuestions();
        localStorage.setItem("preguntasDesarrolloSeleccionadas", JSON.stringify(preguntasDesarrollo));
    }

    console.log('Preguntas de desarrollo seleccionadas:', preguntasDesarrollo.length, preguntasDesarrollo);

    const savedEssayIndex = localStorage.getItem("currentEssayIndex");
    indiceDesarrollo = savedEssayIndex !== null ? parseInt(savedEssayIndex, 10) : 0;
    mostrarPreguntaDesarrollo(indiceDesarrollo);

    document.getElementById("btnFinalizarDesarrollo").addEventListener("click", () => {
        Swal.fire({
            title: "Parte de desarrollo finalizada",
            text: "Has respondido todas las preguntas abiertas. Se generará el resumen.",
            icon: "success",
            confirmButtonText: "Continuar a descargar resumen",
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => {
            window.location.href = "resumen.html"; // Cambia esto si usas otra ruta
        });
    });
}

function mostrarPreguntaDesarrollo(index) {
    // Mostrar advertencia solo en la primera pregunta
    if (index === 0 && !localStorage.getItem("developmentWarningShown")) {
        Swal.fire({
            icon: 'warning',
            title: 'Importante',
            text: 'Una vez que avanza a la siguiente pregunta no podrá regresar a la anterior, deberá decidir con cuidado esta opción',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        });
        localStorage.setItem("developmentWarningShown", "true");
    }

    // Guardar tiempo de pregunta anterior
    if (questionStartTime !== null && indiceDesarrollo !== index) {
        const timeSpent = Date.now() - questionStartTime;
        if (!questionTimes.desarrollo) questionTimes.desarrollo = {};
        questionTimes.desarrollo[indiceDesarrollo] = timeSpent;
        saveQuestionTimes();
    }

    // Iniciar tiempo para nueva pregunta
    questionStartTime = Date.now();
    const contenedor = document.getElementById("essay-container");
    const pregunta = preguntasDesarrollo[index];

    indiceDesarrollo = index; // Actualiza el índice global
    localStorage.setItem("currentEssayIndex", indiceDesarrollo); // Guarda el índice actual

    // Destruir instancia previa de TinyMCE si existe
    if (tinymce.get(`respuesta-${index}`)) {
        tinymce.get(`respuesta-${index}`).destroy();
    }

    // Limpiar
    contenedor.innerHTML = `
    <h2>Parte 2: Preguntas de desarrollo</h2>
    <div class="essay-question">
        <label for="respuesta-${index}"><strong>${index + 1}.</strong> ${pregunta}</label><br>
        <textarea id="respuesta-${index}" placeholder="Escribe tu respuesta aquí...">${obtenerRespuestaDesarrollo(index)}</textarea>
    </div>
    <div class="essay-navigation">
        <button id="btnSiguienteDesarrollo">Siguiente</button>
        <button id="btnFinalizarDesarrollo" style="display: none;">Finalizar Parte de Desarrollo</button>
    </div>
  `;

    // Inicializar TinyMCE
    const isMobile = window.innerWidth <= 600;

    tinymce.init({
        selector: `#respuesta-${index}`,
        height: 450,
        skin: 'oxide',
        content_css: 'default',
        menubar: isMobile ? false : 'edit view insert format tools table help',
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount', 'autosave'
        ],
        toolbar_mode: isMobile ? 'sliding' : 'wrap',
        toolbar: isMobile ?
            'undo redo | bold italic underline | alignleft aligncenter alignright | numlist bullist | fullscreen' :
            'undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | removeformat | table link | code preview fullscreen | help',
        toolbar_sticky: true,
        autosave_ask_before_unload: false,
        autosave_interval: '30s',
        autosave_prefix: `essay-${index}-`,
        content_style: `
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 15px; 
                line-height: 1.7; 
                color: #2c3e50;
                padding: 20px;
                max-width: none;
                background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            }         
            p { margin-bottom: 14px; }
            
            h1, h2, h3 { 
                color: #004080; 
                margin-top: 20px; 
                margin-bottom: 12px;
                font-weight: 600;
            }            
            ul, ol { padding-left: 25px; }
            li { margin-bottom: 6px; }            
            strong { color: #004080; font-weight: 600; }
            em { color: #19A06E; }          
            blockquote {
                border-left: 4px solid #19A06E;
                background: rgba(25, 160, 110, 0.1);
                padding: 15px 20px;
                margin: 15px 0;
                border-radius: 0 8px 8px 0;
            }
        `,
        branding: false,
        resize: 'both',
        statusbar: true,
        elementpath: !isMobile,
        promotion: false,
        placeholder: 'Desarrolla tu respuesta de manera clara y detallada...',
        setup: function (editor) {
            editor.on('init', function () {
                const container = editor.getContainer();
                container.classList.add('tinymce-container');
            });

            editor.on('change keyup', function () {
                const content = editor.getContent();
                guardarRespuestaDesarrollo(index, content);
            });

            editor.on('focus', function () {
                const container = editor.getContainer();
                container.classList.add('tinymce-focused');
            });

            editor.on('blur', function () {
                const container = editor.getContainer();
                container.classList.remove('tinymce-focused');
            });
        }
    });

    document.getElementById("btnSiguienteDesarrollo").addEventListener("click", () => {
        // Obtener contenido de TinyMCE
        const editor = tinymce.get(`respuesta-${indiceDesarrollo}`);
        const respuestaActual = editor ? editor.getContent({ format: 'text' }).trim() : '';

        // Verificar si la respuesta está vacía
        if (!respuestaActual) {
            Swal.fire({
                icon: 'warning',
                title: 'Respuesta vacía',
                text: '¿Deseas continuar sin responder esta pregunta?',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    cancelButton: 'swal-instrucciones-cancel',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Usuario eligió continuar
                    continuarSiguientePregunta();
                }
                // Si cancela, no hace nada y se queda en la pregunta actual
            });
        } else {
            // Si hay respuesta, continuar normalmente
            continuarSiguientePregunta();
        }

        function continuarSiguientePregunta() {
            // Guardar tiempo de pregunta actual
            if (questionStartTime !== null) {
                const timeSpent = Date.now() - questionStartTime;
                if (!questionTimes.desarrollo) questionTimes.desarrollo = {};
                questionTimes.desarrollo[indiceDesarrollo] = timeSpent;
                saveQuestionTimes();
            }

            // Guardar contenido de TinyMCE
            const editor = tinymce.get(`respuesta-${indiceDesarrollo}`);
            const contenido = editor ? editor.getContent() : '';
            guardarRespuestaDesarrollo(indiceDesarrollo, contenido);

            // Destruir el editor actual antes de crear el siguiente
            if (editor) {
                tinymce.remove(`#respuesta-${indiceDesarrollo}`);
            }

            if (indiceDesarrollo < preguntasDesarrollo.length - 1) {
                indiceDesarrollo++;
                localStorage.setItem("currentEssayIndex", indiceDesarrollo); // Guarda el nuevo índice
                mostrarPreguntaDesarrollo(indiceDesarrollo);
                cargarPanelLateralDesarrollo(); // Actualiza el panel lateral

                // Scroll hacia arriba inmediato para móviles
                window.scrollTo({ top: 0, behavior: 'instant' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                // Timeout adicional para asegurar en móviles
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                }, 100);
            }
        }
    });

    // Mostrar u ocultar el botón Finalizar
    if (indiceDesarrollo === preguntasDesarrollo.length - 1) {
        document.getElementById("btnSiguienteDesarrollo").style.display = "none";
        document.getElementById("btnFinalizarDesarrollo").style.display = "inline-block";
        document.getElementById("btnFinalizarDesarrollo").addEventListener("click", finalizarDesarrollo);
    }

    // Guardar cambios automáticamente
    document.getElementById(`respuesta-${index}`).addEventListener("input", function () {
        guardarRespuestaDesarrollo(index, this.value);
    });
}

function guardarRespuestaDesarrollo(index, texto) {
    const examData = JSON.parse(localStorage.getItem("examData")) || {};
    examData.respuestasDesarrollo = examData.respuestasDesarrollo || {};
    examData.respuestasDesarrollo[index] = texto;
    localStorage.setItem("examData", JSON.stringify(examData));
    cargarPanelLateralDesarrollo(); // Actualiza visualmente los botones
}

function obtenerRespuestaDesarrollo(index) {
    const examData = JSON.parse(localStorage.getItem("examData")) || {};
    const contenido = examData.respuestasDesarrollo?.[index] || "";
    // Escapar el contenido HTML para evitar problemas en el textarea inicial
    return contenido.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cargarPanelLateralDesarrollo() {
    const panel = document.getElementById("essayProgressList");
    panel.innerHTML = "";
    preguntasDesarrollo.forEach((_, i) => {
        const box = document.createElement("div");
        box.classList.add("progress-box");
        box.textContent = i + 1;

        // Colorea si ya respondió (verificar contenido sin HTML)
        const examData = JSON.parse(localStorage.getItem("examData")) || {};
        const contenido = examData.respuestasDesarrollo?.[i] || "";
        const tieneContenido = contenido.replace(/<[^>]*>/g, '').trim().length > 0;

        if (tieneContenido) {
            box.classList.add("answered");
        }

        // Si es la pregunta actual, resaltarla
        if (i === indiceDesarrollo) {
            box.classList.add("active-question");
        }

        box.style.cursor = "default";
        panel.appendChild(box);
    });
}
////////////////////////////////////////

//////////////////////////////////
//ValidarDatosDelEstudiante.js
/////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    const nameInput = document.getElementById("studentName");
    const idInput = document.getElementById("studentID");
    const validarBtn = document.getElementById("validarDatosBtn");

    if (!nameInput || !idInput || !validarBtn) return;

    const examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    document.getElementById("uniqueSelection").style.display = "none"; // Oculta al cargar

    if (examData.nombre && examData.cedula) {
        nameInput.value = examData.nombre;
        idInput.value = examData.cedula;
        nameInput.disabled = true;
        idInput.disabled = true;
        validarBtn.disabled = true;
        validarBtn.style.display = "none";
        document.getElementById("uniqueSelection").style.display = "block"; // Mostrar si ya estaba guardado

        //Para mostrar u ocultar la parte de desarrollo
        checkIfDevelopmentShouldShow();

        return;
    }

    validarBtn.addEventListener("click", function () {
        const nombre = nameInput.value.trim();
        const cedula = idInput.value.trim();

        if (!validarNombre(nombre)) {
            Swal.fire({
                icon: "error",
                title: "Nombre inválido",
                text: "El nombre debe tener exactamente 3 palabras, cada una con mínimo 4 letras y máximo 18 letras.",
                confirmButtonText: "Entendido",
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            });
            return;
        }

        if (!/^\d{9,}$/.test(cedula)) {
            Swal.fire({
                icon: "error",
                title: "Cédula inválida",
                text: "La cédula debe tener al menos 9 dígitos y máximo 12.",
                confirmButtonText: "Entendido",
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            });
            return;
        }

        // Guardar en EXAM_STORAGE_KEY
        const estado = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
        estado.nombre = nombre;
        estado.cedula = cedula;
        localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(estado));

        nameInput.disabled = true;
        idInput.disabled = true;
        validarBtn.disabled = true;
        validarBtn.style.display = "none";
        checkIfDevelopmentShouldShow();

        Swal.fire({
            icon: "success",
            title: "Datos validados",
            text: "Nombre y cédula han sido guardados correctamente. Ahora puede comenzar con la Parte 1: Selección Única.",
            confirmButtonText: "Comenzar Parte 1",
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => {
            // Ocultar sección de datos del estudiante
            document.getElementById("name-section").style.display = "none";
            document.getElementById("uniqueSelection").style.display = "block";
            // Asegurar que se inicialice la selección única y se muestre el mensaje
            initUniqueSelection();
            renderProgressBar();
            // Forzar que aparezca el mensaje de la primera pregunta
            localStorage.removeItem("selectionWarningShown");
            loadQuestion(0);
        });
    });

    function validarNombre(nombre) {
        const partes = nombre.split(/\s+/).filter(Boolean);
        if (partes.length !== 3) return false;
        return partes.every(p => p.length >= 4 && p.length <= 18);
    }

    // Definición de la función que controla el mostrar desarrollo
    function checkIfDevelopmentShouldShow() {
        if (localStorage.getItem("parte1Finalizada") === "true") {
            document.getElementById("essay").style.display = "block";
            initDevelopmentPart(); // O la función que uses para iniciar desarrollo
        } else {
            document.getElementById("essay").style.display = "none";
        }
    }

});

// Mostrar los datos guardados en consola (desde EXAM_STORAGE_KEY)
const datos = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY));
console.log(datos?.nombre);
console.log(datos?.cedula);
//////////////////////////////////////////////////

//////////////////////////////////
//PreguntasSeleccionUnica.js
/////////////////////////////////
let currentQuestion = 0;
let studentAnswers = [];

const uniqueQuestions = [
    {
        question: `¿Cuál es la función de un controlador (driver) en un sistema informático? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Mejorar la velocidad de internet.",
            "Permitir que el hardware y el software interactúen correctamente.",
            "Proteger la computadora contra virus.",
            "Crear archivos de texto."
        ],
        correct: "Permitir que el hardware y el software interactúen correctamente."
    },
    {
        question: `¿Si tu impresora no responde al intentar imprimir, ¿cuál podría ser una causa relacionada con los drivers? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El documento es demasiado grande.",
            "El driver de la impresora está ausente o dañado.",
            "El monitor está apagado.",
            "El mouse está desconectado."
        ],
        correct: "El driver de la impresora está ausente o dañado."
    },
    {
        question: `¿Qué sucede si instalas un driver equivocado para tu tarjeta de video? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El sistema operativo se actualiza automáticamente.",
            "Puede haber errores gráficos o fallos del sistema.",
            "El equipo lo busca y como no lo encuentra lo desactiva para mejorar su rendimiento.",
            "El antivirus se desactiva."
        ],
        correct: "Puede haber errores gráficos o fallos del sistema."
    },
    {
        question: `¿Cuál de los siguientes dispositivos requiere instalación de drivers que no sean genéricos para funcionar plenamente? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Ratón USB.",
            "Monitor estándar.",
            "Teclado mecánico básico.",
            "Tarjeta de sonido dedicada."
        ],
        correct: "Tarjeta de sonido dedicada."
    },
    {
        question: `¿Qué es un driver oficial? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un controlador desarrollado por el fabricante del hardware.",
            "Un programa hecho por usuarios.",
            "Un software que viene en CD pirata.",
            "Un antivirus gratuito."
        ],
        correct: "Un controlador desarrollado por el fabricante del hardware."
    },
    {
        question: `¿Cuál es una característica de los drivers genéricos? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Son exclusivos para un solo modelo.",
            "Funcionan con varios dispositivos similares, pero no siempre aprovechan todas las funciones.",
            "Son siempre más rápidos.",
            "Vienen preinstalados en el hardware."
        ],
        correct: "Funcionan con varios dispositivos similares, pero no siempre aprovechan todas las funciones."
    },
    {
        question: `¿Qué herramienta de Windows permite desinstalar un driver defectuoso? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Panel de control de energía.",
            "Administrador de dispositivos.",
            "Paint.",
            "Calculadora."
        ],
        correct: "Administrador de dispositivos."
    },
    {
        question: `¿Qué puede pasar si dos drivers intentan controlar el mismo recurso de hardware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El equipo será menos rápido.",
            "Puede haber conflictos y fallos del sistema.",
            "Se instalarán más programas.",
            "El antivirus se acivará y no se actualizará."
        ],
        correct: "Puede haber conflictos y fallos del sistema."
    },
    {
        question: `¿Cuál es una forma común de instalar drivers en Windows? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Por correo electrónico.",
            "Al conectar el dispositivo, Windows busca e instala el driver automáticamente.",
            "Usando un navegador web.",
            "A través del BIOS."
        ],
        correct: "Al conectar el dispositivo, Windows busca e instala el driver automáticamente."
    },
    {
        question: `¿Qué es el malware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un programa que daña o roba información.",
            "Un tipo de hardware mailicioso.",
            "Un driver de impresora dañado.",
            "Un firewall mal configurado."
        ],
        correct: "Un programa que daña o roba información."
    },
    {
        question: `¿Cuál es una buena práctica al instalar software descargado de internet? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Instalar cualquier archivo sin revisar su origen.",
            "Descargar solo desde sitios oficiales o confiables.",
            "Instalar programas sin antivirus.",
            "Descargar solo archivos pequeños."
        ],
        correct: "Descargar solo desde sitios oficiales o confiables."
    },
    {
        question: `¿Qué técnica usan los ciberdelincuentes para engañar a los usuarios y obtener información personal? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Phishing",
            "un Firewall",
            "Los backup",
            "La fragmentación de disco"
        ],
        correct: "Phishing"
    },
    {
        question: `¿Cuál es la función principal de un firewall? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Bloquear accesos no autorizados a la red o sistema.",
            "Mejorar la velocidad de la computadora.",
            "Instalar drivers.",
            "Crear documentos."
        ],
        correct: "Bloquear accesos no autorizados a la red o sistema."
    },
    {
        question: `¿Por qué es riesgoso usar la misma contraseña en varios servicios? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Porque es difícil de recordar.",
            "Si una contraseña es robada, todas las cuentas pueden ser vulneradas.",
            "Mejora la seguridad.",
            "Facilita el acceso."
        ],
        correct: "Si una contraseña es robada, todas las cuentas pueden ser vulneradas."
    },
    {
        question: `¿Qué sistema de autenticación es más seguro? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Solo contraseña",
            "Doble factor de autenticación (2FA)",
            "Contraseña simple",
            "Fecha de nacimiento"
        ],
        correct: "Doble factor de autenticación (2FA)"
    },
    {
        question: `¿Por qué no es recomendable conectar USB desconocidos a la computadora? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Pueden contener malware.",
            "Mejoran el rendimiento.",
            "No presentan ningún riesgo.",
            "Aumentan la memoria RAM."
        ],
        correct: "Pueden contener malware."
    },
    {
        question: `¿Cuál es la función de un antivirus? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Detectar y eliminar software malicioso.",
            "Instalar drivers.",
            "Mejorar la velocidad de internet.",
            "Crear copias de seguridad."
        ],
        correct: "Detectar y eliminar software malicioso."
    },
    {
        question: `¿Qué es un spyware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un programa que recopila información sin permiso.",
            "Un driver de sonido.",
            "Un firewall.",
            "Un tipo de hardware."
        ],
        correct: "Un programa que recopila información sin permiso."
    },
    {
        question: `¿Cuál de las siguientes es una contraseña segura? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "123456",
            "MiNombre2024",
            "!Qw3rT$9pL##",
            "Fecha de nacimiento"
        ],
        correct: "!Qw3rT$9pL##"
    },
    {
        question: `¿Qué puede provocar un driver corrupto? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Mejorar el rendimiento.",
            "Pantallas azules y errores del sistema.",
            "Instalar programas nuevos.",
            "Aumentar la memoria RAM."
        ],
        correct: "Pantallas azules y errores del sistema."
    },
    {
        question: `¿Para qué sirve el Administrador de dispositivos en Windows? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Gestionar hardware y drivers instalados.",
            "Escribir textos.",
            "Navegar por internet.",
            "Proteger contra virus."
        ],
        correct: "Gestionar hardware y drivers instalados."
    },
    {
        question: `¿Qué es un driver genérico? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un controlador que puede funcionar con varios dispositivos, pero no es específico.",
            "Un virus.",
            "Un firewall.",
            "Un controlador legitimo pero encontrado en Internet."
        ],
        correct: "Un controlador que puede funcionar con varios dispositivos, pero no es específico."
    },
    {
        question: `¿Qué sucede si instalas un driver incompatible con tu sistema operativo? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El equipo funcionará igual.",
            "Puede dejar de funcionar el dispositivo o causar errores.",
            "Mejorará la seguridad.",
            "El antivirus se actualizará."
        ],
        correct: "Puede dejar de funcionar el dispositivo o causar errores."
    },
    {
        question: `¿Qué es un driver oficial? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El que proviene del fabricante del hardware.",
            "Un programa hecho por terceros.",
            "Un software de seguridad.",
            "Un editor de texto."
        ],
        correct: "El que proviene del fabricante del hardware."
    },
    {
        question: `¿Cuál de los siguientes NO es un tipo de malware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Ransomware",
            "Firewall",
            "Virus",
            "Troyano"
        ],
        correct: "Firewall"
    },
    {
        question: `¿Qué es un troyano? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un malware que se oculta como software legítimo.",
            "Un driver de video desconocido.",
            "Un firewall mal configurado.",
            "Un navegador web que se hace pasar por uno."
        ],
        correct: "Un malware que se oculta como software legítimo."
    },
    {
        question: `¿Qué hace el ransomware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Cifra archivos y exige un pago para liberarlos.",
            "Mejora el rendimiento del equipo.",
            "Instala drivers maliciosos.",
            "Es un tipo de firewall."
        ],
        correct: "Cifra archivos y exige un pago para liberarlos."
    },
    {
        question: `¿Cuál es la función del BIOS o firmware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Inicializar el hardware antes de cargar el sistema operativo.",
            "Instalar programas.",
            "Crear documentos.",
            "Navegar en internet."
        ],
        correct: "Inicializar el hardware antes de cargar el sistema operativo."
    },
    {
        question: `¿Qué es el middleware? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Software que permite la comunicación entre aplicaciones y hardware.",
            "Un tipo de malware.",
            "Un driver de red",
            "Un antivirus que nos proteje de los mediadores"
        ],
        correct: "Software que permite la comunicación entre aplicaciones y hardware."
    },
    {
        question: `¿Qué herramienta de Windows ayuda a identificar problemas de drivers? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Visor de eventos",
            "Bloc de notas",
            "Antivirus",
            "Calculadora"
        ],
        correct: "Visor de eventos"
    },
    {
        question: `¿Qué es una pantalla azul de la muerte (BSOD)? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Un error crítico del sistema, a menudo causado por drivers defectuosos.",
            "Un antivirus.",
            "Un firewall.",
            "Un driver de sonido que no funciona."
        ],
        correct: "Un error crítico del sistema, a menudo causado por drivers defectuosos."
    },
    {
        question: `¿Cuál de las siguientes acciones mejora la seguridad informática? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Actualizar el software y los drivers.",
            "Compartir contraseñas.",
            "Descargar de cualquier sitio.",
            "Usar la misma contraseña en todos los servicios."
        ],
        correct: "Actualizar el software y los drivers."
    },
    {
        question: `¿Qué hace Windows al detectar un nuevo dispositivo? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Busca e instala el driver automáticamente si está disponible.",
            "Elimina archivos.",
            "Apaga el equipo.",
            "Formatea el disco duro."
        ],
        correct: "Busca e instala el driver automáticomente si está disponible."
    },
    {
        question: `¿Cómo puedes restaurar un driver problemático? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Volviendo a una versión anterior.",
            "Desinstalando el sistema operativo.",
            "Eliminando todos los archivos.",
            "Reiniciando el router."
        ],
        correct: "Volviendo a una versión anterior."
    },
    {
        question: `¿Qué es un driver de red? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Permite la conexión a redes e internet.",
            "Un tipo de malware.",
            "Un firewall.",
            "Un editor de audio."
        ],
        correct: "Permite la conexión a redes e internet."
    },
    {
        question: `¿Qué puede causar un error al instalar un driver? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "El dispositivo puede quedar inutilizable.",
            "Mejorar el rendimiento.",
            "Instalar un antivirus.",
            "Aumentar la memoria RAM."
        ],
        correct: "El dispositivo puede quedar inutilizable."
    },
    {
        question: `¿Qué es una actualización de driver? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Instalar una versión más reciente para mejorar compatibilidad y seguridad.",
            "Eliminar archivos del sistema operativo.",
            "Cambiar la contraseña para evitar malos controladores.",
            "Formatear el disco para que los controladores se instalen de nuevo."
        ],
        correct: "Instalar una versión más reciente para mejorar compatibilidad y seguridad."
    },
    {
        question: `¿Qué es un driver de sonido? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Permite gestionar la entrada y salida de audio.",
            "Un tipo de malware.",
            "Un firewall.",
            "Un editor de fotos."
        ],
        correct: "Permite gestionar la entrada y salida de audio."
    },
    {
        question: `¿Qué es el software de virtualización? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Permite crear y gestionar máquinas virtuales.",
            "Un driver de impresora.",
            "Un antivirus.",
            "Un hardware externo."
        ],
        correct: "Permite crear y gestionar máquinas virtuales."
    },
    {
        question: `¿Qué puede provocar la pérdida de datos en un sistema? ${UNIQUE_QUESTIONS_VALUE}`,
        options: [
            "Malware y drivers defectuosos.",
            "Actualizar el sistema.",
            "Cambiar el mouse.",
            "Instalar un firewall."
        ],
        correct: "Malware y drivers defectuosos."
    },
];

function loadQuestion(index) {
    // Mostrar advertencia solo en la primera pregunta
    if (index === 0 && !localStorage.getItem("selectionWarningShown")) {
        Swal.fire({
            icon: 'info',
            title: 'Parte 1: Selección Única',
            text: 'Seleccione la respuesta correcta haciendo clic en la opción de su preferencia. Una vez seleccionada, podrá avanzar a la siguiente pregunta. Recuerde que no podrá regresar a preguntas anteriores.',
            confirmButtonText: 'Comenzar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        });
        localStorage.setItem("selectionWarningShown", "true");
    }

    // Guardar tiempo de pregunta anterior
    if (questionStartTime !== null && currentQuestion !== index) {
        const timeSpent = Date.now() - questionStartTime;
        if (!questionTimes.seleccionUnica) questionTimes.seleccionUnica = {};
        questionTimes.seleccionUnica[currentQuestion] = timeSpent;
        saveQuestionTimes();
    }

    // Iniciar tiempo para nueva pregunta
    questionStartTime = Date.now();

    const q = window.uniqueQuestions[index];
    const container = document.getElementById("question-content");

    container.innerHTML = `
        <p style="font-size: 1.1em; font-weight: bold; color: #004080; margin-bottom: 15px;">
            <strong>${index + 1}.</strong> ${q.question}
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            ${q.options.map(opt => `
                <label style="background: #f5f9ff; border: 1px solid #cce0f5; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
                <input type="radio" name="q${index}" value="${opt}" 
                    onchange="saveAnswer(${index}, this.value)" 
                    ${studentAnswers[index] === opt ? "checked" : ""}
                    style="margin-right: 8px;">
                ${opt}
            </label>
            `).join('')}
        </div>
    `;

    const nextBtn = document.getElementById("nextBtn");

    if (studentAnswers[index]) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = 1;
        nextBtn.style.cursor = "pointer";
    } else {
        nextBtn.disabled = true;
        nextBtn.style.opacity = 0.6;
        nextBtn.style.cursor = "not-allowed";
    }

    updateProgress();
    nextBtn.innerText = (index === window.uniqueQuestions.length - 1) ? "Finalizar selección única" : "Siguiente";
}

function guardarDatosEstudiante() {
    const nombre = document.getElementById("studentName").value.trim();
    const cedula = document.getElementById("studentID").value.trim();

    let data = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    data.nombreEstudiante = nombre;
    data.cedulaEstudiante = cedula;
    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(data));
}

function saveAnswer(index, value) {
    studentAnswers[index] = value;
    localStorage.setItem("studentAnswers", JSON.stringify(studentAnswers));
    localStorage.setItem("currentQuestionIndex", currentQuestion);
    updateProgress();

    let examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    const q = window.uniqueQuestions[index];
    if (!examData.respuestasSeleccionUnica) {
        examData.respuestasSeleccionUnica = [];
    }
    examData.respuestasSeleccionUnica[index] = {
        pregunta: q.question,
        respuesta: value
    };

    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(examData));
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.disabled = false;
    nextBtn.style.opacity = 1;
    nextBtn.style.cursor = "pointer";
}

function nextQuestion() {
    // Guardar tiempo de pregunta actual
    if (questionStartTime !== null) {
        const timeSpent = Date.now() - questionStartTime;
        if (!questionTimes.seleccionUnica) questionTimes.seleccionUnica = {};
        questionTimes.seleccionUnica[currentQuestion] = timeSpent;
        saveQuestionTimes();
    }

    updateProgress();
    if (currentQuestion < window.uniqueQuestions.length - 1) {
        currentQuestion++;
        localStorage.setItem("currentQuestionIndex", currentQuestion);
        loadQuestion(currentQuestion);
    } else {
        // Mostrar resultados aquí o continuar al paso siguiente
        Swal.fire({
            title: "¡Parte #1 finalizada!",
            text: "Ahora continúa con la parte #2 de desarrollo.",
            icon: "success",
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then(() => {
            // Mostrar mensaje de transición a desarrollo
            Swal.fire({
                icon: 'info',
                title: 'Parte 2: Desarrollo',
                text: 'Ahora responderá preguntas de desarrollo. Una vez que avance a la siguiente pregunta no podrá regresar a la anterior.',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'swal-instrucciones',
                    title: 'swal-instrucciones-title',
                    confirmButton: 'swal-instrucciones-confirm',
                    icon: 'swal-instrucciones-icon',
                    htmlContainer: 'swal-instrucciones-text'
                },
                didOpen: () => {
                    const popup = document.querySelector('swal-instrucciones');
                    if (popup) {
                        popup.scrollTop = 0; // Forzar scroll arriba
                    }
                }
            }).then(() => {
                localStorage.setItem("parte1Finalizada", "true");  // <-- guardamos la bandera
                document.getElementById("uniqueSelection").style.display = "none"; // Ocultar sección de selección única
                document.getElementById("essay").style.display = "block"; // Mostrar sección de desarrollo
                // Solo inicializar preguntas aleatorias si no existen
                const savedQuestions = localStorage.getItem("preguntasDesarrolloSeleccionadas");
                if (!savedQuestions) {
                    preguntasDesarrollo = getRandomDevelopmentQuestions();
                    localStorage.setItem("preguntasDesarrolloSeleccionadas", JSON.stringify(preguntasDesarrollo));
                } else {
                    preguntasDesarrollo = JSON.parse(savedQuestions);
                }
                const savedEssayIndex = localStorage.getItem("currentEssayIndex");
                indiceDesarrollo = savedEssayIndex !== null ? parseInt(savedEssayIndex, 10) : 0;
                mostrarPreguntaDesarrollo(indiceDesarrollo);
                cargarPanelLateralDesarrollo();
            });
        });
        console.log("Respuestas del estudiante:", studentAnswers);
    }
}

function renderProgressBar() {
    const container = document.getElementById("progressList");
    const total = window.uniqueQuestions.length;
    document.getElementById("totalQuestions").textContent = total;
    container.innerHTML = "";

    for (let i = 0; i < total; i++) {
        const box = document.createElement("div");
        box.classList.add("progress-box");
        box.textContent = i + 1;

        // Colorea si ya respondió
        box.style.background = studentAnswers[i] ? "rgba(248, 194, 26, 1)" : "#f1f1f1";

        // Si es la pregunta actual, resaltarla
        if (i === currentQuestion) {
            box.classList.add("active-question");
        }

        box.style.cursor = "default";
        container.appendChild(box);
    }
}

function updateProgress() {
    renderProgressBar();
}

//Para hacer las preguntas aleatoras
function shuffleArray(inputArray) {
    return inputArray
        .map(q => ({
            ...q,
            options: q.options.sort(() => Math.random() - 0.5) // Opcional: también randomiza las opciones
        }))
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

// Inicialización (puedes llamarla al mostrar esta sección)
// Funciones para manejo de tiempos
function saveQuestionTimes() {
    localStorage.setItem("questionTimes", JSON.stringify(questionTimes));
}

function loadQuestionTimes() {
    const saved = localStorage.getItem("questionTimes");
    if (saved) {
        questionTimes = JSON.parse(saved);
    }
}

function initUniqueSelection() {
    loadQuestionTimes(); // Cargar tiempos guardados
    const saved = localStorage.getItem("uniqueQuestionsRandomizadas");

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                window.uniqueQuestions = parsed.slice(0, UNIQUE_QUESTIONS_COUNT);
            } else {
                throw new Error("No es un array");
            }
        } catch (e) {
            const randomized = shuffleArray(uniqueQuestions).slice(0, UNIQUE_QUESTIONS_COUNT);
            window.uniqueQuestions = randomized;
            localStorage.setItem("uniqueQuestionsRandomizadas", JSON.stringify(randomized));
        }
    } else {
        const randomized = shuffleArray(uniqueQuestions).slice(0, UNIQUE_QUESTIONS_COUNT);
        window.uniqueQuestions = randomized;
        localStorage.setItem("uniqueQuestionsRandomizadas", JSON.stringify(randomized));
    }

    const savedAnswers = localStorage.getItem("studentAnswers");
    if (savedAnswers) {
        studentAnswers = JSON.parse(savedAnswers);
    } else {
        studentAnswers = [];
    }

    const savedIndex = localStorage.getItem("currentQuestionIndex");
    currentQuestion = savedIndex !== null ? parseInt(savedIndex, 10) : 0;

    loadQuestion(currentQuestion);
}

initUniqueSelection();
////////////////////////////////////////////////

//////////////////////////////////
//CuandoIngresen.js
/////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    // No mostrar el mensaje si el exámen ya inició
    const examData = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY)) || {};
    if (examData.nombre && examData.cedula && examData.instruccionesAceptadas) {
        return; // Salir sin mostrar el mensaje
    }

    Swal.fire({
        title: 'Instrucciones importantes',
        html: `
      <p>Este exámen es individual y debe completarse sin ayuda.</p>
      <br>
      <ul style="text-align:left;">
        <li>Por favor lea las intrucciones generales rápidamente</li>
        <li>No recargue la página</li>
        <li>No cambie de pestaña o ventana</li>
        <li>Evite cerrar el navegador</li>
        <li>El código para empezar a realizar el exámen es: <strong>${ACCESS_CODE}</strong></li>
      </ul>
      <br>
      <b>¿Esta de acuerdo?</b>
    `,
        position: 'top',
        imageUrl: 'images/question.png',
        confirmButtonText: 'Sí estoy de acuerdo',
        cancelButtonText: 'No estoy de acuerdo',
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'swal-instrucciones',
            title: 'swal-instrucciones-title',
            confirmButton: 'swal-instrucciones-confirm',
            cancelButton: 'swal-instrucciones-cancel',
            icon: 'swal-instrucciones-icon',
            htmlContainer: 'swal-instrucciones-text',
            image: 'swal-instrucciones-image'
        },
        didOpen: () => {
            const popup = document.querySelector('swal-instrucciones');
            if (popup) {
                popup.scrollTop = 0; // Forzar scroll arriba
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log("Usuario aceptó estas instrucciones");
            // Aquí puedes permitir continuar con el exámen
        } else if (result.isDismissed) {
            // El usuario presionó cancelar o cerró el cuadro
            //window.location.href = "https://www.google.com"; // o cerrar ventana: window.close();
        }
    });
});
////////////////////////////////////////

//////////////////////////////////
//MenuHamburguesa.js
/////////////////////////////////
var visible_menu = false;
let menu = document.getElementById("nav");
let nav_bar = document.getElementById("nav-bar");
let links = document.querySelectorAll("nav a");

function showHideMenu() {
    if (visible_menu == false) {
        menu.style.display = "block";
        nav_bar.style.display = "block";
        visible_menu = true;
    } else {
        menu.style.display = "none";
        nav_bar.style.display = "fixed";
        visible_menu = false;
    }

    //   Agregar un event listener para cerrar el menú si se hace clic fuera de él
    document.addEventListener("click", function (event) {
        var target = event.target;
        if (!menu.contains(target) && target != nav_bar) {
            menu.style.display = "none";
            nav_bar.style.display = "fixed";
            visible_menu = false;
        }
        for (var x = 0; x < links.length; x++) {
            links[x].onclick = function () {
                menu.style.display = "none";
                visible_menu = false;
            }
        }
    });
}
///////////////////////////////////////////////

//////////////////////////////////
//ResumenRespuestas.js
/////////////////////////////////
// GENERACIÓN DE RESUMEN DE RESPUESTAS
function obtenerResumenRespuestas() {
    const estado = JSON.parse(localStorage.getItem(EXAM_STORAGE_KEY));
    if (!estado) return "No hay respuestas registradas.";

    const respuestas = estado.respuestas || {};
    const nombre = estado.nombreEstudiante || "Sin nombre";
    const cedula = estado.cedulaEstudiante || "Sin cédula";

    let resumen = `Resumen de Respuestas del Estudiante\n`;
    resumen += `Nombre: ${nombre}\n`;
    resumen += `Cédula: ${cedula}\n\n`;

    // Aquí agrego el estado de aceptación de instrucciones
    const aceptado = estado.instruccionesAceptadas ? "Sí" : "No";
    resumen += `Instrucciones aceptadas: ${aceptado}\n`;

    if (estado.fechaAceptacion) {
        resumen += `Fecha de aceptación: ${new Date(estado.fechaAceptacion).toLocaleString()}\n`;
    }

    resumen += "\n";

    Object.entries(respuestas).forEach(([clave, valor]) => {
        let tipo = "Otro";
        if (clave.startsWith("pregunta_")) tipo = "Selección Única";
        else if (clave.startsWith("desarrollo_")) tipo = "Desarrollo";
        else if (clave.startsWith("practica_")) tipo = "Práctica";

        const numero = clave.split("_")[1];
        resumen += `• Pregunta ${numero} (${tipo}): ${formatearValorRespuesta(valor)}\n`;
    });

    return resumen;
}

function formatearValorRespuesta(valor) {
    if (!valor) return "No respondida";

    if (typeof valor === "string") {
        return valor.trim() === "" ? "No respondida" : valor;
    }

    if (typeof valor === "object" && valor.nombreArchivo) {
        return `Archivo: ${valor.nombreArchivo}`;
    }

    return JSON.stringify(valor);
}

function guardarRespuestaDesarrollo(index, texto) {
    const examData = JSON.parse(localStorage.getItem("examData")) || {};
    examData.respuestasDesarrollo = examData.respuestasDesarrollo || {};
    examData.respuestasDesarrollo[index] = texto;
    localStorage.setItem("examData", JSON.stringify(examData));
    cargarPanelLateralDesarrollo(); // Actualiza visualmente los botones
}
///////////////////////////////////////////

//////////////////////////////////
//GenerarPDF.js
/////////////////////////////////
// Función auxiliar para formatear tiempo
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Función para renderizar HTML con formato real en PDF
function renderHTMLToPDF(doc, htmlContent, startY, maxWidth = 170) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let currentY = startY;

    function processElement(element, currentStyle = {}) {
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    doc.setFont(undefined, currentStyle.bold ? 'bold' : currentStyle.italic ? 'italic' : 'normal');
                    doc.setFontSize(currentStyle.fontSize || 12);

                    const lines = doc.splitTextToSize(text, maxWidth);
                    const dimensions = doc.getTextDimensions(lines);
                    doc.text(lines, 20, currentY);
                    currentY += dimensions.h;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                let newStyle = { ...currentStyle };

                if (tagName === 'table') {
                    const rows = node.querySelectorAll('tr');
                    const tableData = [];
                    let headers = [];

                    rows.forEach((row, rowIndex) => {
                        const cells = row.querySelectorAll('td, th');
                        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

                        if (rowIndex === 0 && row.querySelectorAll('th').length > 0) {
                            headers = cellTexts;
                        } else {
                            tableData.push(cellTexts);
                        }
                    });

                    doc.autoTable({
                        startY: currentY,
                        head: headers.length > 0 ? [headers] : undefined,
                        body: tableData,
                        margin: { left: 20 },
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: [200, 200, 200] }
                    });
                    currentY = doc.lastAutoTable.finalY + 5;
                    continue;
                }

                switch (tagName) {
                    case 'strong':
                    case 'b':
                        newStyle.bold = true;
                        break;
                    case 'em':
                    case 'i':
                        newStyle.italic = true;
                        break;
                    case 'u':
                        // Para subrayado, usar texto normal pero agregar indicador
                        processElement(node, newStyle);
                        continue;
                    case 'h1':
                        newStyle.fontSize = 16;
                        newStyle.bold = true;
                        currentY += 5;
                        break;
                    case 'h2':
                        newStyle.fontSize = 14;
                        newStyle.bold = true;
                        currentY += 5;
                        break;
                    case 'h3':
                        newStyle.fontSize = 13;
                        newStyle.bold = true;
                        currentY += 3;
                        break;
                    case 'p':
                        currentY += 3;
                        break;
                    case 'br':
                        currentY += 5;
                        continue;
                    case 'ul':
                    case 'ol':
                        currentY += 3;
                        break;
                    case 'li':
                        doc.setFont(undefined, 'normal');
                        doc.setFontSize(12);
                        doc.text('• ', 20, currentY);
                        const liContent = node.textContent.trim();
                        if (liContent) {
                            const lines = doc.splitTextToSize(liContent, maxWidth - 10);
                            const dimensions = doc.getTextDimensions(lines);
                            doc.text(lines, 30, currentY);
                            currentY += dimensions.h;
                        }
                        continue;
                }

                processElement(node, newStyle);

                if (['p', 'h1', 'h2', 'h3', 'div', 'ul', 'ol'].includes(tagName)) {
                    currentY += 3;
                }
            }
        }
    }

    processElement(tempDiv);
    return currentY;
}

document.getElementById("btnGenerarPDF").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    const examData = JSON.parse(localStorage.getItem("examData")) || {};
    console.log("Datos exámen para PDF:", examData);

    const nombre = examData.nombre || "No registrado";
    const cedula = examData.cedula || "No registrada";
    const respuestasSeleccion = examData.respuestasSeleccionUnica || {};
    const respuestasDesarrollo = examData.respuestasDesarrollo || {};
    const respuestasPractica = examData.respuestasPractica || {};
    const dtStatus = examData.dtStatus || false;
    const tabSwitched = examData.tabSwitched || false;
    const intentosRestantes = examData.intentosRestantes || 0;

    //Título de PDF
    doc.setFontSize(16);
    doc.text("Resumen del Exámen", 20, y);
    y += 10;

    //Instrucciones aceptadas
    doc.setFontSize(12);
    if (examData.instruccionesAceptadas) {
        doc.text("El estudiante aceptó las instrucciones del exámen.", 20, y);
    } else {
        doc.text("El estudiante NO aceptó las instrucciones del exámen.", 20, y);
    }
    y += 10;

    // Información del estudiante
    doc.setFontSize(12);
    doc.text(`Nombre del estudiante: ${nombre}`, 20, y);
    y += 10;
    doc.text(`Cédula: ${cedula}`, 20, y);
    y += 10;

    // Agregar fecha y hora actual del exámen
    const fechaTexto = document.getElementById("dateDisplay")?.textContent || "Fecha no disponible";
    doc.text(fechaTexto, 20, y);
    y += 10;

    // Agregar tiempo restante del exámen
    const tiempoTexto = document.getElementById("timer")?.textContent || "Tiempo no disponible";
    doc.text(tiempoTexto, 20, y);
    y += 10;

    // Estado de DevTools (discreto)
    doc.text(`DT: ${dtStatus ? 'true' : 'false'}`, 20, y);
    y += 10;

    // Cambio de pestaña
    doc.text(`Cambio pestaña: ${tabSwitched ? 'Sí' : 'No'}`, 20, y);
    y += 10;

    // Intentos restantes
    doc.text(`Intentos restantes: ${intentosRestantes}`, 20, y);
    y += 10;

    // Obtener tiempos guardados
    const tiemposGuardados = JSON.parse(localStorage.getItem("questionTimes")) || {};

    // Selección única
    const datosSeleccion = respuestasSeleccion.map((item, index) => {
        const tiempo = tiemposGuardados.seleccionUnica?.[index] ? formatTime(tiemposGuardados.seleccionUnica[index]) : "N/A";
        return [
            `${index + 1}. ${item.pregunta}`,
            item.respuesta,
            tiempo
        ];
    });

    if (datosSeleccion.length > 0) {
        doc.text("Respuestas de selección única:", 20, y);
        y += 5;
        doc.autoTable({
            startY: y,
            head: [["Pregunta", "Respuesta", "Tiempo"]],
            body: datosSeleccion,
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    // Desarrollo - incluir las preguntas
    const preguntasDesarrolloSeleccionadas = JSON.parse(localStorage.getItem("preguntasDesarrolloSeleccionadas")) || [];

    if (Object.keys(respuestasDesarrollo).length > 0) {
        doc.text("Respuestas de desarrollo:", 20, y);
        y += 5;

        // construir cuerpo de tabla
        const datosDesarrollo = Object.entries(respuestasDesarrollo).map(([key, value], index) => {
            const tiempo = tiemposGuardados.desarrollo?.[index]
                ? formatTime(tiemposGuardados.desarrollo[index])
                : "N/A";
            const pregunta = preguntasDesarrolloSeleccionadas[index] || `Pregunta ${index + 1}`;

            // Aseguramos que vvalue sea texto plano (sin etiquetas HTML)
            const div = document.createElement("div");
            div.innerHTML = value;
            const respuestaLimpia = div.textContent || div.innerText || "";

            return [
                `${index + 1}. ${pregunta}`,
                respuestaLimpia,
                tiempo
            ];

        });

        if (datosDesarrollo.length > 0) {
            doc.autoTable({
                startY: y,
                head: [["Pregunta", "Respuesta", "Tiempo"]],
                body: datosDesarrollo,
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    cellWidth: 'wrap',
                    valign: 'top'
                },
                columnStyles: {
                    0: { cellWidth: 60 }, //Pregunta
                    1: { cellWidth: 100 }, //Respuesta
                    2: { cellWidth: 20 }  //Tiempo
                }
            });
            y = doc.lastAutoTable.finalY + 10;
        }
    }

    // Práctica
    if (Object.keys(respuestasPractica).length > 0) {
        doc.text("Respuestas de práctica:", 20, y);
        y += 5;

        const datosPractica = [];

        // Pareo
        if (respuestasPractica.pareoMatches && respuestasPractica.pareoData) {
            Object.entries(respuestasPractica.pareoMatches).forEach(([palabraIndex, defIndex]) => {
                const palabra = respuestasPractica.pareoData.palabras[palabraIndex] || "Palabra no encontrada";
                const definicion = respuestasPractica.pareoData.definiciones[defIndex] || "Definición no encontrada";
                datosPractica.push(["Pareo", `${palabra} - ${definicion}`, "Completado"]);
            });
        }

        // Crucigrama
        if (respuestasPractica.crucigramaPalabras) {
            Object.entries(respuestasPractica.crucigramaPalabras).forEach(([clave, datos]) => {
                const estado = datos.completa ? "Completado" : "Incompleto";
                datosPractica.push([`Crucigrama ${clave}`, datos.palabra || "(vacía)", estado]);
            });
        } else if (respuestasPractica.crucigramaAnswers) {
            const respuestasCrucigrama = Object.keys(respuestasPractica.crucigramaAnswers).length;
            datosPractica.push(["Crucigrama", `${respuestasCrucigrama} casillas completadas`, "Parcial"]);
        }

        // Sopa de letras
        if (respuestasPractica.sopaFoundWords) {
            const palabrasEncontradas = respuestasPractica.sopaFoundWords.join(", ");
            datosPractica.push(["Sopa de letras", palabrasEncontradas || "Ninguna palabra encontrada", "Completado"]);
        }

        if (datosPractica.length > 0) {
            doc.autoTable({
                startY: y,
                head: [["Actividad", "Respuesta", "Estado"]],
                body: datosPractica,
            });
        }
    }

    // Guardar el PDF
    doc.save("resumen_examen.pdf");
});
///////////////////////////////////////////////////

//////////////////////////////////
//TerceraParte.js
/////////////////////////////////
// Variables globales para la tercera parte
let currentPracticeSection = 1;
let pareoMatches = {};
let crucigramaAnswers = {};
let sopaFoundWords = [];
let currentCrucigramaWord = null; // Para mantener la dirección de escritura

// Datos para el pareo - Términos del examen
const pareoDataComplete = {
    items: [
        { palabra: "Chocolatey", definicion: "Admin de paquetes SO Windows, hay que instalarlo antes de usar, comando para utilizar es choco" },
        { palabra: "Iwr", definicion: "Admin de paquetes SO Windows, hay que instalarlo antes de usar, este instala apps sin necesidad de permisos, comando para utilizar es scoop" },
        { palabra: "Sudo", definicion: "Administrador de paquetes SO Linux, viene preinstalado, comando para utilizar es sudo" },
        { palabra: "Bash", definicion: "Viene preinstalado, intérprete de comandos y un lenguaje de scripting que proporciona CLI en Linux" },
        { palabra: "Cmd", definicion: "Command Prompt, intérprete de comandos y un lenguaje de scripting que proporciona CLI en Windows" },
        { palabra: "Apt-Get", definicion: "Herramienta en línea de comandos usado en distribuciones base Linux para gestionar(Instalar, Actualizar o borrar) paquetes de software, se debe usar prefijo ya sea sudo, Iwr, etc en Bash" },
        { palabra: "Driver", definicion: "Software que controla dispositivos de hardware" },
        { palabra: "Firewall", definicion: "Sistema de protección contra amenazas de red" },
        { palabra: "Antivirus", definicion: "Programa de software diseñado para detectar, prevenir y eliminar malware como Troyanos, gusanos, spyware y otras amenazas informáticas" },
        { palabra: "Winget", definicion: "Administrador de paquetes de Windows, herramienta de línea de comandos oficial de Microsoft que permite instalar, actualizar y desinstalar paquetes de software" },
        { palabra: "Seguridad Informática", definicion: "Conjunto de medidas y técnicas para proteger sistemas, redes y datos de amenazas digitales u organización de amenazas informáticas" },
        { palabra: "Malware", definicion: "Cualquier software diseñado para dañar, explotar o interrumpir el funcionamiento de un dispositivo, redes o sistemas informáticos" },
        { palabra: "Hosts", definicion: "Archivo de texto plano del sistema operativo que sirve para mapear nombres de dominio a direcciones IP de forma manual" },
        { palabra: "nslookup", definicion: "herramienta de comandos utilizada para consultar servidores DNS y verificar la resolución de nombres de dominio" },
        { palabra: "Loopback", definicion: "dirección estándar de bucle de retorno = 127.0.0.1 que es la dirección de red" },
    ]
};

// Función para seleccionar elementos aleatorios del pareo
function getRandomPareoData() {
    const shuffled = [...pareoDataComplete.items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, PRACTICE_QUESTIONS_PAREO); // Seleccionar 8 elementos

    return {
        palabras: selected.map(item => item.palabra),
        definiciones: selected.map(item => item.definicion).sort(() => Math.random() - 0.5) // Mezclar definiciones
    };
}

let pareoData = getRandomPareoData();

// Datos para el crucigrama - Diseño 18x18 con intersecciones reales
const crucigramaData = {
    words: [
        // Horizontales
        { word: "SPYWARE", clue: "Recopila información del usuario sin su consentimiento.", row: 1, col: 4, direction: "horizontal" },
        { word: "PHISHING", clue: "Robo de información confidencial: Contraseñas, datos bancarios, documentos personales.", row: 4, col: 6, direction: "horizontal" },
        { word: "VIRUS", clue: "Se adjunta a archivos y se propaga cuando se ejecuta.", row: 8, col: 1, direction: "horizontal" },
        { word: "MALWARE", clue: "Cualquier software diseñado para dañar, explotar o interrumpir dispositivos, redes o sistemas informáticos.", row: 10, col: 3, direction: "horizontal" },
        { word: "SISTEMA", clue: "Conjunto organizado de elementos que funcionan juntos para procesar, almacenar y transmitir información(Es lo que ataca cualquier virus).", row: 13, col: 7, direction: "horizontal" },
        // Verticales
        { word: "ANTIVIRUS", clue: "Software diseñado para detectar, prevenir y eliminar malware.", row: 4, col: 1, direction: "vertical" },
        { word: "GUSANOS", clue: "Se replican automáticamente a través de redes sin necesidad de acción del usuario.", row: 7, col: 4, direction: "vertical" },
        { word: "TROYANOS", clue: "Se disfrazan de software legítimo para engañar a los usuarios y dar acceso a atacantes.", row: 6, col: 7, direction: "vertical" },
        { word: "RANSOMWARE", clue: "Secuestra datos o sistemas, los bloquea y exige un rescate para liberarlos y restaurar el acceso.", row: 1, col: 9, direction: "vertical" },
        { word: "ADWARE", clue: "Muestra anuncios no deseados y recopila datos de navegación, para el marketing malicioso.", row: 8, col: 11, direction: "vertical" },
        { word: "SEGURIDAD", clue: "Conjunto de medidas y técnicas para proteger sistemas, redes y datos de amenazas digitales.", row: 2, col: 13, direction: "vertical" },
    ],
    gridSize: 15
};

// Palabras para la sopa de letras - Términos del examen con definiciones
const sopaWordsComplete = [
    { word: "USB", definition: "Puerto universal que uno debe escanear siempre al conectarlo a la PC ya que pueden traer malware" },
    { word: "UNICAS", definition: "Nuestras contraseñas deben ser largas, complejas ... y seguras, dificiles de adivinar" },
    { word: "VIRUS", definition: "Software malicioso que se adjunta a archivos" },
    { word: "FIREWALL", definition: "Sistema de protección contra amenazas de red" },
    { word: "SISTEMA", definition: "Conjunto organizado de elementos que funcionan juntos, es lo que el virus ataca" },
    { word: "COOKIES", definition: "Pequeños archivos que los sitios web guardan en tu navegador para recordar tus preferencias y mejorar tu experiencia, como iniciar sesión, guardar contenido que nos interesa entre otros." },
    { word: "OFICIALES", definition: "Tipos de drivers que existen son 3: Sistema Operativo, Genericos y ..." },
    { word: "HARDWARE", definition: "Los drivers son los qué permiten al software comunicarse con el ... de tu PC" },
    { word: "INFORMACION", definition: "los drivers sirven para brindar ... de a que dispositivo comprende y para así enviar ordenes a un hardware" },
    { word: "MALWARE", definition: "Software malicioso que daña sistemas" },
    { word: "DRIVER", definition: "Software que controla dispositivos de hardware" },
    { word: "SOFTWARE", definition: "Programas y conjuntos de instrucciones que permiten a las computadoras realizar tareas específicas (lo intangible de una PC)" },
    { word: "SISTEMA", definition: "Conjunto organizado de elementos que funcionan juntos" },
    { word: "HOSTS", definition: "Archivo de texto local en el sistema operativo que traduce nombres de dominio a direcciones IP su Uso: Bloquear sitios web o redireccionar dominios manualmente" },
    { word: "LOOPBACK", definition: "Interfaz de red virtual que se utiliza para que una computadora se comunique consigo misma" },
    { word: "NSLOOKUP", definition: "herramienta de comandos (CLI) utilizada para consultar directamente a los servidores DNS su Uso: Diagnóstico de red y auditoría de servidores de nombres." },

];

// Función para generar sopa de letras aleatoria
function generateSopaLetras() {
    const gridSize = 16;
    const selectedItems = [...sopaWordsComplete].sort(() => Math.random() - 0.5).slice(0, PRACTICE_QUESTIONS_SOUP);
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    const placedWords = [];

    // Colocar palabras aleatoriamente
    selectedItems.forEach(item => {
        const word = item.word;
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 50) {
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(grid, word, row, col, direction, gridSize)) {
                placeWord(grid, word, row, col, direction);
                placedWords.push({ word, row, col, direction, definition: item.definition });
                placed = true;
            }
            attempts++;
        }
    });

    // Llenar espacios vacíos con letras aleatorias
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }

    return {
        grid,
        words: placedWords.map(p => p.word),
        wordPositions: placedWords,
        definitions: placedWords
    };
}

function canPlaceWord(grid, word, row, col, direction, gridSize) {
    if (direction === 'horizontal') {
        if (col + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) {
                return false;
            }
        }
    } else {
        if (row + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) {
                return false;
            }
        }
    }
    return true;
}

function placeWord(grid, word, row, col, direction) {
    if (direction === 'horizontal') {
        for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i];
        }
    } else {
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col] = word[i];
        }
    }
}

let sopaData = generateSopaLetras();

// Función para inicializar la tercera parte
function initPracticePart() {
    // Regenerar datos aleatorios si no existen
    const savedData = JSON.parse(localStorage.getItem("practiceData")) || {};

    if (!savedData.pareoGenerated) {
        pareoData = getRandomPareoData();
        savedData.pareoData = pareoData;
        savedData.pareoGenerated = true;
    } else {
        pareoData = savedData.pareoData;
    }

    if (!savedData.sopaGenerated) {
        sopaData = generateSopaLetras();
        savedData.sopaData = sopaData;
        savedData.sopaGenerated = true;
    } else {
        sopaData = savedData.sopaData;
    }

    pareoMatches = savedData.pareoMatches || {};
    crucigramaAnswers = savedData.crucigramaAnswers || {};
    sopaFoundWords = savedData.sopaFoundWords || [];
    currentPracticeSection = savedData.currentSection || 1;

    // Guardar datos actualizados
    localStorage.setItem("practiceData", JSON.stringify(savedData));
}

// Función para mostrar la sección de práctica actual
function showPracticeSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.practice-section').forEach(s => s.style.display = 'none');

    currentPracticeSection = section;

    switch (section) {
        case 1:
            document.getElementById('pareo-section').style.display = 'block';
            initPareo();
            break;
        case 2:
            document.getElementById('crucigrama-section').style.display = 'block';
            initCrucigrama();
            break;
        case 3:
            document.getElementById('sopa-section').style.display = 'block';
            initSopaLetras();
            break;
    }

    updatePracticeProgress();
    savePracticeData();
}

// Función para actualizar el progreso visual
function updatePracticeProgress() {
    document.querySelectorAll('.practice-box').forEach((box, index) => {
        box.classList.remove('active', 'completed');

        if (index + 1 === currentPracticeSection) {
            box.classList.add('active');
        } else if (index + 1 < currentPracticeSection) {
            box.classList.add('completed');
        }
    });
}

// Inicializar pareo
function initPareo() {
    document.getElementById("name-section").style.display = "none";
    const container = document.getElementById('pareo-container');
    container.innerHTML = `
        <div class="pareo-column">
            <h4>Palabras</h4>
            ${pareoData.palabras.map((palabra, index) =>
        `<div class="pareo-item" data-type="palabra" data-index="${index}" onclick="selectPareoItem(this)">${palabra}</div>`
    ).join('')}
        </div>
        <div class="pareo-column">
            <h4>Definiciones</h4>
            ${pareoData.definiciones.map((def, index) =>
        `<div class="pareo-item" data-type="definicion" data-index="${index}" onclick="selectPareoItem(this)">${def}</div>`
    ).join('')}
        </div>
    `;

    // Restaurar matches guardados con colores
    Object.entries(pareoMatches).forEach(([palabraIndex, defIndex], matchIndex) => {
        const palabraEl = container.querySelector(`[data-type="palabra"][data-index="${palabraIndex}"]`);
        const defEl = container.querySelector(`[data-type="definicion"][data-index="${defIndex}"]`);
        if (palabraEl && defEl) {
            const colorClass = `color-${(matchIndex % 8) + 1}`;
            palabraEl.classList.add('matched', colorClass);
            defEl.classList.add('matched', colorClass);
        }
    });
    scrollToTop();
    window.scrollTo(top, 0);
}

let selectedPareoItem = null;

function selectPareoItem(element) {
    // Si el elemento ya está emparejado, permitir deshacerlo
    if (element.classList.contains('matched')) {
        const elementIndex = element.dataset.index;
        const elementType = element.dataset.type;

        // Encontrar y deshacer el emparejamiento
        if (elementType === 'palabra') {
            const defIndex = pareoMatches[elementIndex];
            if (defIndex !== undefined) {
                const defElement = document.querySelector(`[data-type="definicion"][data-index="${defIndex}"]`);
                if (defElement) {
                    // Remover todas las clases de color y matched
                    defElement.classList.remove('matched');
                    for (let i = 1; i <= 8; i++) {
                        defElement.classList.remove(`color-${i}`);
                    }
                }
                delete pareoMatches[elementIndex];
            }
        } else {
            // Buscar la palabra que está emparejada con esta definición
            const palabraIndex = Object.keys(pareoMatches).find(key => pareoMatches[key] == elementIndex);
            if (palabraIndex !== undefined) {
                const palabraElement = document.querySelector(`[data-type="palabra"][data-index="${palabraIndex}"]`);
                if (palabraElement) {
                    // Remover todas las clases de color y matched
                    palabraElement.classList.remove('matched');
                    for (let i = 1; i <= 8; i++) {
                        palabraElement.classList.remove(`color-${i}`);
                    }
                }
                delete pareoMatches[palabraIndex];
            }
        }

        // Remover todas las clases de color y matched del elemento actual
        element.classList.remove('matched');
        for (let i = 1; i <= 8; i++) {
            element.classList.remove(`color-${i}`);
        }
        savePracticeData();
        return;
    }

    if (selectedPareoItem) {
        selectedPareoItem.classList.remove('selected');

        if (selectedPareoItem.dataset.type !== element.dataset.type) {
            // Hacer match
            const palabraIndex = selectedPareoItem.dataset.type === 'palabra' ?
                selectedPareoItem.dataset.index : element.dataset.index;
            const defIndex = selectedPareoItem.dataset.type === 'definicion' ?
                selectedPareoItem.dataset.index : element.dataset.index;

            // Determinar el color para esta nueva pareja
            const matchCount = Object.keys(pareoMatches).length;
            const colorClass = `color-${(matchCount % 8) + 1}`;

            pareoMatches[palabraIndex] = defIndex;
            selectedPareoItem.classList.add('matched', colorClass);
            element.classList.add('matched', colorClass);
            savePracticeData();
        }
        selectedPareoItem = null;
    } else {
        selectedPareoItem = element;
        element.classList.add('selected');
    }
}

// Inicializar crucigrama
function initCrucigrama() {
    document.getElementById("name-section").style.display = "none";
    const container = document.getElementById('crucigrama-container');
    const gridSize = crucigramaData.gridSize;

    // Crear grid vacío
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));

    // Marcar celdas que deben ser blancas
    crucigramaData.words.forEach(wordData => {
        for (let i = 0; i < wordData.word.length; i++) {
            if (wordData.direction === 'horizontal') {
                grid[wordData.row][wordData.col + i] = true;
            } else {
                grid[wordData.row + i][wordData.col] = true;
            }
        }
    });

    // Generar HTML del grid
    let gridHTML = '';
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cellId = `cell-${row}-${col}`;
            if (grid[row][col]) {
                // Verificar si es el inicio de una palabra
                const wordNumber = getWordNumber(row, col);
                const numberLabel = wordNumber ? `<span class="word-number">${wordNumber}</span>` : '';

                gridHTML += `<div class="crucigrama-cell white">
                    ${numberLabel}
                    <input type="text" maxlength="1" id="${cellId}" onchange="saveCrucigramaAnswer('${cellId}', this.value)" oninput="handleCrucigramaInput(this, ${row}, ${col})" onkeydown="handleCrucigramaKeydown(event, ${row}, ${col})" onfocus="setCrucigramaWord(${row}, ${col})">
                </div>`;
            } else {
                gridHTML += `<div class="crucigrama-cell black"></div>`;
            }
        }
    }

    // Generar pistas
    const cluesHTML = `
        <div class="crucigrama-clues">
            <div class="clues-column">
                <h4>Horizontales</h4>
                ${crucigramaData.words.filter(w => w.direction === 'horizontal')
            .map((w, i) => `<p><strong>${i + 1}.</strong> ${w.clue}</p>`).join('')}
            </div>
            <div class="clues-column">
                <h4>Verticales</h4>
                ${crucigramaData.words.filter(w => w.direction === 'vertical')
            .map((w, i) => `<p><strong>${i + 1}.</strong> ${w.clue}</p>`).join('')}
            </div>
        </div>
    `;

    container.innerHTML = `<div class="crucigrama-grid">${gridHTML}</div>` + cluesHTML;

    // Restaurar respuestas guardadas
    Object.entries(crucigramaAnswers).forEach(([cellId, value]) => {
        const input = document.getElementById(cellId);
        if (input) input.value = value;
    });

    // Capturar palabras completas al cargar
    scrollToTop();
    window.scrollTo(top, 0);
    capturarPalabrasCompletas();
}

function getWordNumber(row, col) {
    // Separar palabras horizontales y verticales
    const horizontales = crucigramaData.words.filter(w => w.direction === 'horizontal');
    const verticales = crucigramaData.words.filter(w => w.direction === 'vertical');

    // Buscar en horizontales (numeración 1, 2, 3)
    for (let i = 0; i < horizontales.length; i++) {
        if (horizontales[i].row === row && horizontales[i].col === col) {
            return i + 1;
        }
    }

    // Buscar en verticales (numeración 1, 2, 3)
    for (let i = 0; i < verticales.length; i++) {
        if (verticales[i].row === row && verticales[i].col === col) {
            return i + 1;
        }
    }

    return null;
}

function saveCrucigramaAnswer(cellId, value) {
    crucigramaAnswers[cellId] = value.toUpperCase();
    // Capturar palabras completas
    capturarPalabrasCompletas();
    savePracticeData();
}

function capturarPalabrasCompletas() {
    const palabrasCompletas = {};

    crucigramaData.words.forEach((wordData, index) => {
        let palabra = '';
        for (let i = 0; i < wordData.word.length; i++) {
            let cellId;
            if (wordData.direction === 'horizontal') {
                cellId = `cell-${wordData.row}-${wordData.col + i}`;
            } else {
                cellId = `cell-${wordData.row + i}-${wordData.col}`;
            }
            palabra += crucigramaAnswers[cellId] || '';
        }

        const tipo = wordData.direction === 'horizontal' ? 'H' : 'V';
        const numero = crucigramaData.words.filter(w => w.direction === wordData.direction).indexOf(wordData) + 1;
        palabrasCompletas[`${tipo}${numero}`] = {
            palabra: palabra,
            correcta: wordData.word,
            completa: palabra.length === wordData.word.length && palabra !== '',
            pista: wordData.clue
        };
    });

    // Guardar las palabras completas en practiceData
    const practiceData = JSON.parse(localStorage.getItem("practiceData")) || {};
    practiceData.crucigramaPalabras = palabrasCompletas;
    localStorage.setItem("practiceData", JSON.stringify(practiceData));

    // También guardar en examData
    let examData = JSON.parse(localStorage.getItem("examData")) || {};
    if (!examData.respuestasPractica) examData.respuestasPractica = {};
    examData.respuestasPractica.crucigramaPalabras = palabrasCompletas;
    localStorage.setItem("examData", JSON.stringify(examData));
}

// Función para manejar entrada de texto (solo una letra)
function handleCrucigramaInput(input, row, col) {
    let value = input.value;

    // Solo permitir letras, eliminar espacios y caracteres especiales
    value = value.replace(/[^A-Za-z]/g, '');

    // Solo tomar la primera letra si hay más de una
    if (value.length > 1) {
        value = value.charAt(0);
    }

    // Convertir a mayúscula
    value = value.toUpperCase();

    // Actualizar el input
    input.value = value;

    // Guardar la respuesta
    saveCrucigramaAnswer(input.id, value);

    // Si se escribió una letra, avanzar automáticamente
    if (value) {
        setTimeout(() => {
            moveToNextCell(row, col, value);
        }, 10);
    }
}

// Función para establecer la palabra actual cuando se hace foco
function setCrucigramaWord(row, col) {
    // Si no hay palabra actual, establecer la primera que encuentre
    if (!currentCrucigramaWord) {
        currentCrucigramaWord = findWordAtPosition(row, col);
    }
    // Si la posición actual no pertenece a la palabra actual, cambiar
    else if (!isPositionInWord(row, col, currentCrucigramaWord)) {
        currentCrucigramaWord = findWordAtPosition(row, col);
    }
}

// Función para manejar navegación con teclado en el crucigrama
function handleCrucigramaKeydown(event, row, col) {
    const key = event.key;

    // Bloquear espacios y caracteres especiales
    if (key === ' ' || key.match(/[^a-zA-Z\b\t\r\n]/)) {
        event.preventDefault();
        return;
    }

    // Si es una letra, el manejo se hace en handleCrucigramaInput
    if (key.match(/[a-zA-Z]/)) {
        return;
    }

    // Navegación con flechas
    let newRow = row;
    let newCol = col;

    switch (key) {
        case 'ArrowUp':
            newRow = row - 1;
            break;
        case 'ArrowDown':
            newRow = row + 1;
            break;
        case 'ArrowLeft':
            newCol = col - 1;
            break;
        case 'ArrowRight':
            newCol = col + 1;
            break;
        case 'Backspace':
            // Si la celda actual está vacía, ir a la anterior
            if (!event.target.value) {
                moveToPreviousCell(row, col);
            }
            return;
        default:
            return;
    }

    // Buscar la siguiente celda válida
    const nextCell = document.getElementById(`cell-${newRow}-${newCol}`);
    if (nextCell && nextCell.tagName === 'INPUT') {
        event.preventDefault();
        nextCell.focus();
    }
}

// Función para moverse a la siguiente celda automáticamente
function moveToNextCell(row, col, value) {
    if (!value || !currentCrucigramaWord) return;

    let nextRow = row;
    let nextCol = col;

    if (currentCrucigramaWord.direction === 'horizontal') {
        nextCol = col + 1;
    } else {
        nextRow = row + 1;
    }

    // Verificar si la siguiente celda está dentro de la palabra actual
    if (isPositionInWord(nextRow, nextCol, currentCrucigramaWord)) {
        const nextCell = document.getElementById(`cell-${nextRow}-${nextCol}`);
        if (nextCell && nextCell.tagName === 'INPUT') {
            nextCell.focus();
        }
    } else {
        // Si llegamos al final de la palabra, limpiar la palabra actual
        currentCrucigramaWord = null;
    }
}

// Función para moverse a la celda anterior
function moveToPreviousCell(row, col) {
    if (!currentCrucigramaWord) return;

    let prevRow = row;
    let prevCol = col;

    if (currentCrucigramaWord.direction === 'horizontal') {
        prevCol = col - 1;
    } else {
        prevRow = row - 1;
    }

    if (isPositionInWord(prevRow, prevCol, currentCrucigramaWord)) {
        const prevCell = document.getElementById(`cell-${prevRow}-${prevCol}`);
        if (prevCell && prevCell.tagName === 'INPUT') {
            prevCell.focus();
            prevCell.value = '';
            saveCrucigramaAnswer(`cell-${prevRow}-${prevCol}`, '');
        }
    }
}

// Función para encontrar la palabra en una posición (prioriza la palabra actual si existe)
function findWordAtPosition(row, col) {
    const wordsAtPosition = crucigramaData.words.filter(word => isPositionInWord(row, col, word));

    // Si hay múltiples palabras en esta posición (intersección)
    if (wordsAtPosition.length > 1) {
        // Si ya tenemos una palabra actual y está en esta posición, mantenerla
        if (currentCrucigramaWord && wordsAtPosition.includes(currentCrucigramaWord)) {
            return currentCrucigramaWord;
        }
        // Si no, devolver la primera
        return wordsAtPosition[0];
    }

    return wordsAtPosition[0] || null;
}

// Función para verificar si una posición está dentro de una palabra
function isPositionInWord(row, col, word) {
    if (word.direction === 'horizontal') {
        return row === word.row && col >= word.col && col < word.col + word.word.length;
    } else {
        return col === word.col && row >= word.row && row < word.row + word.word.length;
    }
}

// Inicializar sopa de letras
function initSopaLetras() {
    document.getElementById("name-section").style.display = "none";
    const container = document.getElementById('sopa-container');
    const gridSize = sopaData.grid.length;
    let grid = '';

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cellId = `sopa-${row}-${col}`;
            grid += `<div class="sopa-cell" id="${cellId}" onclick="selectSopaCell(${row}, ${col})">${sopaData.grid[row][col]}</div>`;
        }
    }

    container.innerHTML = grid;

    // Restaurar palabras encontradas en el grid
    restoreFoundWordsInGrid();

    // Mostrar definiciones en lugar de palabras
    const listaPalabras = document.getElementById('lista-palabras');
    listaPalabras.innerHTML = sopaData.definitions.map(item => {
        const guiones = '_'.repeat(item.word.length);
        const encontrada = sopaFoundWords.includes(item.word);
        return `<div class="palabra-item ${encontrada ? 'encontrada' : ''}">
            <div class="definition">${item.definition}:</div>
            <div class="word-spaces">${encontrada ? item.word : guiones}</div>
        </div>`;
    }).join('');
    scrollToTop();
    window.scrollTo(top, 0);
}

let sopaSelection = [];
function selectSopaCell(row, col) {
    const cellId = `sopa-${row}-${col}`;
    const cell = document.getElementById(cellId);

    if (sopaSelection.length === 0) {
        sopaSelection.push({ row, col });
        cell.classList.add('selected');
    } else if (sopaSelection.length === 1) {
        sopaSelection.push({ row, col });
        checkSopaWord();
    }
}

function checkSopaWord() {
    const [start, end] = sopaSelection;
    let word = '';
    let wordReverse = '';

    // Construir la palabra seleccionada
    if (start.row === end.row) {
        // Horizontal
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        for (let col = minCol; col <= maxCol; col++) {
            word += sopaData.grid[start.row][col];
        }
        wordReverse = word.split('').reverse().join('');
    } else if (start.col === end.col) {
        // Vertical
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        for (let row = minRow; row <= maxRow; row++) {
            word += sopaData.grid[row][start.col];
        }
        wordReverse = word.split('').reverse().join('');
    } else {
        // Diagonal
        const rowDiff = end.row - start.row;
        const colDiff = end.col - start.col;
        const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
        const rowStep = rowDiff / steps;
        const colStep = colDiff / steps;

        for (let i = 0; i <= steps; i++) {
            const row = start.row + Math.round(i * rowStep);
            const col = start.col + Math.round(i * colStep);
            word += sopaData.grid[row][col];
        }
        wordReverse = word.split('').reverse().join('');
    }

    // Verificar si la palabra (o su reverso) está en la lista
    const foundWord = sopaData.words.find(w => w === word || w === wordReverse);
    if (foundWord && !sopaFoundWords.includes(foundWord)) {
        sopaFoundWords.push(foundWord);
        markSopaWordFound();
        updateSopaWordsList();
        savePracticeData();

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Palabra encontrada!',
            text: `Has encontrado: ${foundWord}`,
            timer: 2000,
            showConfirmButton: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            }
        });
    }

    // Limpiar selección
    document.querySelectorAll('.sopa-cell.selected').forEach(cell => {
        if (!cell.classList.contains('found')) {
            cell.classList.remove('selected');
        }
    });
    sopaSelection = [];
}

function markSopaWordFound() {
    const [start, end] = sopaSelection;

    if (start.row === end.row) {
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        for (let col = minCol; col <= maxCol; col++) {
            document.getElementById(`sopa-${start.row}-${col}`).classList.add('found');
        }
    } else if (start.col === end.col) {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        for (let row = minRow; row <= maxRow; row++) {
            document.getElementById(`sopa-${row}-${start.col}`).classList.add('found');
        }
    }
}

function updateSopaWordsList() {
    const listaPalabras = document.getElementById('lista-palabras');
    listaPalabras.innerHTML = sopaData.definitions.map(item => {
        const guiones = '_'.repeat(item.word.length);
        const encontrada = sopaFoundWords.includes(item.word);
        return `<div class="palabra-item ${encontrada ? 'encontrada' : ''}">
            <div class="definition">${item.definition}:</div>
            <div class="word-spaces">${encontrada ? item.word : guiones}</div>
        </div>`;
    }).join('');
}

// Función para restaurar palabras encontradas en el grid
function restoreFoundWordsInGrid() {
    sopaFoundWords.forEach(foundWord => {
        const wordPosition = sopaData.wordPositions.find(pos => pos.word === foundWord);
        if (wordPosition) {
            const { row, col, direction, word } = wordPosition;

            for (let i = 0; i < word.length; i++) {
                let cellRow = row;
                let cellCol = col;

                if (direction === 'horizontal') {
                    cellCol = col + i;
                } else {
                    cellRow = row + i;
                }

                const cell = document.getElementById(`sopa-${cellRow}-${cellCol}`);
                if (cell) {
                    cell.classList.add('found');
                }
            }
        }
    });
}

// Función para avanzar a la siguiente sección
function nextPracticeSection() {
    if (currentPracticeSection < 3) {
        Swal.fire({
            title: '¿Continuar a la siguiente actividad?',
            text: 'Estás a punto de pasar a la siguiente actividad práctica.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-instrucciones',
                title: 'swal-instrucciones-title',
                confirmButton: 'swal-instrucciones-confirm',
                cancelButton: 'swal-instrucciones-cancel',
                icon: 'swal-instrucciones-icon',
                htmlContainer: 'swal-instrucciones-text'
            },
            didOpen: () => {
                const popup = document.querySelector('swal-instrucciones');
                if (popup) {
                    popup.scrollTop = 0; // Forzar scroll arriba
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                showPracticeSection(currentPracticeSection + 1);
            }
        });
    } else {
        finalizarPractica();
    }
}


function mostrarPantallaFinalizada() {
    scrollToTop();
    window.scrollTo(top, 0);
    localStorage.setItem("pantallaFinalizadaActiva", "true");
    document.getElementById('practice').style.display = 'none';
    document.getElementById('mostrarPantallaFinalizada').style.display = 'block';
}

function finalizarPractica() {
    Swal.fire({
        title: '¿Deseas finalizar la práctica?',
        text: 'Ya has completado todas las actividades prácticas. Ahora puedes descargar tu examen completo si das a continuar.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'No continuar',
        customClass: {
            popup: 'swal-instrucciones',
            title: 'swal-instrucciones-title',
            confirmButton: 'swal-instrucciones-confirm',
            cancelButton: 'swal-instrucciones-cancel',
            icon: 'swal-instrucciones-icon',
            htmlContainer: 'swal-instrucciones-text'
        },
        didOpen: () => {
            const popup = document.querySelector('swal-instrucciones');
            if (popup) {
                popup.scrollTop = 0; // Forzar scroll arriba
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem("practicaFinalizada", "true");
            mostrarPantallaFinalizada();
        }
    });
}

// Función para guardar datos de práctica
function savePracticeData() {
    // Obtener datos existentes para preservar crucigramaPalabras
    const existingData = JSON.parse(localStorage.getItem("practiceData")) || {};

    const practiceData = {
        currentSection: currentPracticeSection,
        pareoMatches,
        crucigramaAnswers,
        crucigramaPalabras: existingData.crucigramaPalabras || {},
        sopaFoundWords,
        pareoData,
        sopaData,
        pareoGenerated: true,
        sopaGenerated: true
    };
    localStorage.setItem("practiceData", JSON.stringify(practiceData));

    // También guardar en examData para el PDF
    let examData = JSON.parse(localStorage.getItem("examData")) || {};
    examData.respuestasPractica = practiceData;
    localStorage.setItem("examData", JSON.stringify(examData));
}



// Función para finalizar desarrollo y pasar a práctica
function finalizarDesarrollo() {
    Swal.fire({
        title: "Parte de desarrollo finalizada",
        text: "Ahora continúa con la parte 3: Práctica.",
        icon: "success",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'swal-instrucciones',
            title: 'swal-instrucciones-title',
            confirmButton: 'swal-instrucciones-confirm',
            icon: 'swal-instrucciones-icon',
            htmlContainer: 'swal-instrucciones-text'
        },
        didOpen: () => {
            const popup = document.querySelector('swal-instrucciones');
            if (popup) {
                popup.scrollTop = 0; // Forzar scroll arriba
            }
        }
    }).then(() => {
        localStorage.setItem("parte2Finalizada", "true");
        document.getElementById("essay").style.display = "none";
        document.getElementById("practice").style.display = "block";
        initPracticePart();
        showPracticeSection(1);
        updatePracticeProgress();
    });
}
/////////////////////////////////