const cultivo = document.querySelector("#cultivo");
const muestra = document.querySelector("#muestra");
const resultado = document.querySelector("#resultado");

const ejemplos = {
  papa: "Papa · Posible tizón temprano. Registra la observación y consulta a tu técnico.",
  maiz: "Maíz · Posible roya. Registra la parcela para que el técnico revise el caso."
};

cultivo.addEventListener("change", () => {
  muestra.src = "assets/images/" + cultivo.value + ".png";
  muestra.alt = "Ilustración de una hoja de " + cultivo.selectedOptions[0].text;
  resultado.textContent = "Presiona Analizar ejemplo para ver el resultado simulado.";
});

document.querySelector("#analizar").addEventListener("click", () => {
  resultado.textContent = "Resultado simulado: " + ejemplos[cultivo.value];
});
