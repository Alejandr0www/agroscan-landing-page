const cultivo = document.querySelector("#cultivo");
const muestra = document.querySelector("#muestra");
const resultado = document.querySelector("#resultado");

const ejemplos = {
  papa: "Papa · Posible tizón temprano. Registra la observación y consulta a tu técnico.",
  maiz: "Maíz · Posible roya. Registra la parcela para que el técnico revise el caso."
};

cultivo.addEventListener("change", () => {
  muestra.src = "assets/images/" + cultivo.value + "-cultivo.svg";
  muestra.alt = cultivo.value === "papa"
    ? "Planta de papa con hojas compuestas y tubérculos bajo tierra"
    : "Planta de maíz con hojas largas, mazorca y panoja";
  resultado.textContent = "Presiona Analizar ejemplo para ver el resultado simulado.";
});

document.querySelector("#analizar").addEventListener("click", () => {
  resultado.textContent = "Resultado simulado: " + ejemplos[cultivo.value];
});

const formulario = document.querySelector("#consulta");
const confirmacion = document.querySelector("#confirmacion");

formulario.addEventListener("input", () => {
  confirmacion.textContent = "";
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const datos = new FormData(formulario);
  const nombre = datos.get("nombre").trim();
  const mensaje = datos.get("mensaje").trim();
  if (!nombre || !mensaje) {
    confirmacion.textContent = "Escribe tu nombre y una consulta para probar el envío.";
    return;
  }
  formulario.reset();
  confirmacion.textContent = nombre + ", completaste el envío de prueba. No se guardaron tus datos.";
});
