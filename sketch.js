//PROYECTO UNIDAD 3 :DECLARACIÓN DE USO DE LA FUENTE (API EXTERNA):Qué hace el programa con lo que capta: Consulta mediante una petición asíncrona(fetch) el precio actual del Bitcoin en la API de Binance cada 2 segundos.Ese valor numérico se normaliza mediante un mapeo de 0 a 1 para modular la velocidad, el radio de dispersión de los agentes del enjambre y disparar alertas visuales en el panel de UI ante micro-tendencias  NO hace el programa: No almacena bases de datos históricas de criptomonedas, no realiza predicciones financieras automatizadas ni utiliza datos simulados de manera estática, operando exclusivamente sobre la lectura en vivo de la red.

let usarSimulador = false; 

// Calibración dinámica: Se ajustará con la primera lectura del Bitcoin
let minMedido = 0;  
let maxMedido = 0;  
let primerLectura = true;

let umbralAlto = 0.70; 
let umbralBajo = 0.30; 
let estadoActivo = false;
let fuenteFalla = true; 

let tiempoSimulado = 0;
let agentes = [];
let valorDato = 0;
let mensajeAlarma = "Conectando a Binance API...";

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  for(let i = 0; i < 80; i++) {
    agentes.push(new Agente());
  }
  
  // Consultar la API de Binance cada 2 segundos (Sistema realmente vivo)
  setInterval(consultarAPI, 2000);
  consultarAPI(); 
}

function draw() {
  background(15, 30); 

  let senal = leerSenal();

  if (fuenteFalla) {
    mostrarEstadoFalla();
  } else {
    // Histéresis
    if (senal > umbralAlto) {
      estadoActivo = true;
      mensajeAlarma = "¡ALERTA! Micro-tendencia al alza.";
    } else if (senal < umbralBajo) {
      estadoActivo = false;
      mensajeAlarma = "Mercado estable / a la baja.";
    }

    dibujarEnjambre(senal, estadoActivo);
  }
}

function consultarAPI() {
  if (usarSimulador) return;
  
  // API pública de Binance para el precio de Bitcoin en dólares
  fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
    .then(response => {
      if (!response.ok) throw new Error("Error de red");
      return response.json();
    })
    .then(data => {
      valorDato = parseFloat(data.price);
      
      // Calibración dinámica en la primera lectura para asegurar sensibilidad
      if (primerLectura) {
         minMedido = valorDato - 30; // $30 dólares por debajo del precio base
         maxMedido = valorDato + 30; // $30 dólares por encima
         primerLectura = false;
      }
      
      fuenteFalla = false;
    })
    .catch(error => {
      console.error("Falla al consultar API:", error);
      fuenteFalla = true;
    });
}

function leerSenal() {
  let datoCrudo = valorDato;
  
  if (usarSimulador) {
    datoCrudo = map(noise(tiempoSimulado), 0, 1, minMedido - 10, maxMedido + 10);
    tiempoSimulado += 0.02;
    fuenteFalla = false; 
  }
  
  // Traducción a escala 0-1 estricta
  let senalCalibrada = map(datoCrudo, minMedido, maxMedido, 0, 1, true);
  return senalCalibrada;
}

function mostrarEstadoFalla() {
  push();
  fill(255, 60, 60);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  text("⚠️ ERROR 404/500: Falla de conexión con Binance\nReintentando conexión automáticamente...", width/2, height/2);
  pop();
}

function dibujarEnjambre(senal, activo) {
  let radioInteraccion = map(senal, 0, 1, 15, 120);
  // Color anaranjado (estilo Bitcoin) para la alerta
  let colorEnjambre = activo ? color(255, 150, 50) : color(100, 150, 255);

  for (let agente of agentes) {
    agente.mover(senal);
    agente.mostrar(colorEnjambre, radioInteraccion);
  }
  
  // INTERFAZ DE USUARIO CON ALARMAS Y NOTIFICACIONES 
  push();
  fill(0, 200);
  rect(10, 10, 380, 110, 10); 
  
  fill(255);
  noStroke();
  textSize(14);
  
  // Textos actualizados a Bitcoin
  text("📡 PANEL DE DATOS (API BINANCE)", 20, 35);
  
  if (!primerLectura) {
    text("Valor BTC/USDT: $" + valorDato.toFixed(2), 20, 55);
    text("Señal normalizada (0-1): " + senal.toFixed(2), 20, 75);
    
    if (activo) {
      fill(255, 150, 50); // Alerta Naranja
    } else {
      fill(50, 255, 100); // Verde estable
    }
    text("Estado: " + mensajeAlarma, 20, 100);
  } else {
    text("Calibrando precios...", 20, 55);
  }
  pop();
}

// --- CLASE AGENTE ---
class Agente {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D();
  }

  mover(senal) {
    let velocidadActual = map(senal, 0, 1, 0.5, 12);
    this.pos.add(p5.Vector.mult(this.vel, velocidadActual));

    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
  }

  mostrar(colorAgente, tamaño) {
    noStroke();
    fill(colorAgente);
    circle(this.pos.x, this.pos.y, tamaño * 0.15); 
  }
}