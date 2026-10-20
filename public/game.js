const activities = [
  {
    title: "Prima di tutto: serve l’AI?",
    tag: "01 · PARTI DAL PROBLEMA",
    copy: "Classificare i messaggi dei clienti non richiede per forza un modello generativo. Prima individua cosa rende difficile il compito.",
    scenario: "Il team deve smistare messaggi con parole come «rimborso», «consegna» o «accesso». Le regole esistenti coprono già quasi tutti i casi.",
    question: "Qual è il primo passo più sensato?",
    options: [
      "Aggiungere subito un modello grande, così copre ogni caso possibile.",
      "Provare regole chiare sui casi noti e misurare quali eccezioni restano.",
      "Inviare ogni messaggio a più modelli per confrontare le risposte."
    ],
    answer: 1,
    feedback: "Comincia dalla soluzione più semplice che risolve il problema. Se restano casi ambigui, valuta l’AI solo per quelli e confronta qualità e costo."
  },
  {
    title: "Quale modello è sufficiente?",
    tag: "02 · CONFRONTA CON I TEST",
    copy: "«Più grande» non significa automaticamente «più adatto». La qualità va verificata sul compito reale, con esempi rappresentativi.",
    scenario: "Due modelli raggiungono la soglia di qualità richiesta sugli stessi messaggi. Uno è più piccolo e veloce.",
    question: "Come scegli il modello?",
    options: [
      "Scegli quello più piccolo che supera i test e controlla i casi incerti.",
      "Scegli il più grande senza test: essere sovradimensionato garantisce qualità.",
      "Usali entrambi sempre, anche quando danno lo stesso risultato."
    ],
    answer: 0,
    feedback: "Confronta i modelli sugli stessi esempi e scegli il più piccolo che raggiunge la qualità richiesta. Se non è affidabile, passa il caso a una persona."
  },
  {
    title: "Quanto contesto serve davvero?",
    tag: "03 · INVIA SOLO IL NECESSARIO",
    copy: "Ogni informazione inviata aumenta il lavoro e può esporre dati non necessari. Ridurre il contesto non significa eliminare dettagli utili.",
    scenario: "Per classificare un messaggio bastano il testo ricevuto e l’elenco delle categorie. L’applicazione conserva anche anni di cronologia.",
    question: "Che cosa invii al modello?",
    options: [
      "Tutta la cronologia, così il modello può orientarsi meglio.",
      "Il messaggio utile e le categorie ammesse, dopo aver verificato la qualità.",
      "Solo le prime parole del messaggio, senza testare l’effetto."
    ],
    answer: 1,
    feedback: "Invia il contesto minimo sufficiente, definisci una risposta strutturata e valida il risultato. Verifica che le informazioni escluse non servano."
  },
  {
    title: "Una richiesta può diventare molte",
    tag: "04 · EVITA I DOPPIONI",
    copy: "Retry, richieste duplicate e automazioni possono moltiplicare il lavoro. Il sistema dovrebbe ripetere un’operazione solo quando serve.",
    scenario: "Il client riprova quando non riceve risposta. Il server, senza accorgersene, invia di nuovo la stessa classificazione al modello.",
    question: "Quale intervento limita le chiamate inutili?",
    options: [
      "Aumentare i retry automatici finché arriva una risposta.",
      "Rimuovere i controlli e sperare che il client non ripeta.",
      "Riconoscere i doppioni, riusare risultati validi e limitare i tentativi."
    ],
    answer: 2,
    feedback: "Idempotenza, cache quando appropriata e retry limitati aiutano a non rifare il lavoro. Cache, Messenger e RateLimiter sono esempi di strumenti."
  },
  {
    title: "Misura il risultato, non solo il costo",
    tag: "05 · OSSERVA E IMPARA",
    copy: "Token e fatture aiutano a capire il carico, ma non sono da soli una misura delle emissioni. Definisci cosa osservi e i limiti della stima.",
    scenario: "Il team vede il costo mensile totale, ma non sa quante chiamate, retry o classificazioni corrette appartengono alla feature.",
    question: "Quale misura aiuta a decidere se la feature funziona bene?",
    options: [
      "Il costo per classificazione corretta, insieme a chiamate, token e qualità.",
      "Il totale della fattura, senza sapere quale feature l’ha generata.",
      "Il numero di token da solo: descrive con precisione le emissioni."
    ],
    answer: 0,
    feedback: "Osserva chiamate, token, retry e qualità per feature. Per stimare le emissioni dichiara confini e limiti, usando dati del fornitore quando disponibili."
  }
];

const canvasHost = document.querySelector("#world-canvas");
const startButton = document.querySelector("#start-button");
const interactionPrompt = document.querySelector("#interaction-prompt");
const interactButton = document.querySelector("#interact-button");
const activityDialog = document.querySelector("#activity-dialog");
const closeActivity = document.querySelector("#close-activity");
const checkAnswerButton = document.querySelector("#check-answer");
const continueButton = document.querySelector("#continue-button");
const answerContainer = document.querySelector("#answer-options");
const feedbackBox = document.querySelector("#activity-feedback");
const progressCount = document.querySelector("#progress-count");
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const stationListItems = [...document.querySelectorAll("#station-list li")];
const locationTitle = document.querySelector("#location-title");
const locationDescription = document.querySelector("#location-description");
const gameError = document.querySelector("#game-error");

const stations = [
  { position: [-10, 0, -14], color: 0xe87521, name: "Nodo 01 · Scelta semplice", shortName: "Serve l’AI?" },
  { position: [0, 0, -27], color: 0x6ca2a2, name: "Nodo 02 · Modello", shortName: "Quale modello?" },
  { position: [10, 0, -12], color: 0x408982, name: "Nodo 03 · Contesto", shortName: "Quanto testo?" },
  { position: [10, 0, 15], color: 0x815088, name: "Nodo 04 · Richieste", shortName: "Quante chiamate?" },
  { position: [-10, 0, 24], color: 0xe87521, name: "Nodo 05 · Misurazione", shortName: "Come misurare?" }
];

const completedStations = new Set();
const pressedKeys = new Set();
const touchDirections = new Set();
const stationMeshes = [];
const colliders = [];
const rackPlacements = [];
const movementKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

let THREE;
let scene;
let camera;
let renderer;
let player;
let foxBody;
let foxTail;
let activeStation = -1;
let currentActivity = -1;
let gameStarted = false;
let lastFrame = 0;
let lastRender = 0;
let verticalVelocity = 0;
let isGrounded = true;

function showError(message) {
  gameError.replaceChildren(document.createTextNode(message + " "));
  const ebook = document.createElement("a");
  ebook.href = "book.html";
  ebook.textContent = "Apri l’ebook";
  ebook.className = "fallback-link";
  gameError.append(ebook);
  gameError.hidden = false;
}

function material(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(geometry, mat, position, parent = scene) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addBlock(x, y, z, width, height, depth, color, collide = true) {
  addMesh(new THREE.BoxGeometry(width, height, depth), material(color, 0.72, 0.12), [x, y, z]);
  if (collide) colliders.push({ x, z, halfWidth: width / 2, halfDepth: depth / 2 });
}

function addRack(x, z, angle = 0, width = 1.45, depth = 1.2) {
  rackPlacements.push({ x, z, angle, width, depth });
  const rotated = Math.abs(Math.sin(angle)) > 0.5;
  colliders.push({
    x,
    z,
    halfWidth: (rotated ? depth : width) / 2 + 0.18,
    halfDepth: (rotated ? width : depth) / 2 + 0.18
  });
}

function addRackInstances() {
  const rackBody = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), material(0x14295e, 0.38, 0.42), rackPlacements.length
  );
  const rackDoor = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), material(0x203d60, 0.4, 0.3), rackPlacements.length
  );
  const rackCaps = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), material(0x6ca2a2, 0.38, 0.4), rackPlacements.length
  );
  const serverUnits = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), material(0x14295e, 0.34, 0.35), rackPlacements.length * 7
  );
  const ventilation = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x6ca2a2 }), rackPlacements.length * 4
  );
  const statusLeds = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), rackPlacements.length * 14
  );
  const outer = new THREE.Object3D();
  const inner = new THREE.Object3D();
  const world = new THREE.Matrix4();
  const ledColor = new THREE.Color();
  let unitIndex = 0;
  let ventIndex = 0;
  let ledIndex = 0;

  rackPlacements.forEach((rack, index) => {
    outer.position.set(rack.x, 0, rack.z);
    outer.rotation.set(0, rack.angle, 0);
    outer.updateMatrix();
    inner.rotation.set(0, 0, 0);
    inner.position.set(0, 2.2, 0);
    inner.scale.set(rack.width, 4.4, rack.depth);
    inner.updateMatrix();
    world.multiplyMatrices(outer.matrix, inner.matrix);
    rackBody.setMatrixAt(index, world);

    inner.position.set(0, 2.2, rack.depth / 2 + 0.035);
    inner.scale.set(rack.width * 0.9, 4.18, 0.07);
    inner.updateMatrix();
    world.multiplyMatrices(outer.matrix, inner.matrix);
    rackDoor.setMatrixAt(index, world);

    for (let slot = 0; slot < 7; slot += 1) {
      const y = 0.63 + slot * 0.52;
      inner.position.set(0, y, rack.depth / 2 + 0.09);
      inner.scale.set(rack.width * 0.72, 0.43, 0.09);
      inner.updateMatrix();
      world.multiplyMatrices(outer.matrix, inner.matrix);
      serverUnits.setMatrixAt(unitIndex, world);

      for (let light = 0; light < 2; light += 1) {
        inner.position.set(0.43 + light * 0.1, y, rack.depth / 2 + 0.15);
        inner.scale.set(0.045, 0.055, 0.025);
        inner.updateMatrix();
        world.multiplyMatrices(outer.matrix, inner.matrix);
        statusLeds.setMatrixAt(ledIndex, world);
        ledColor.setHex((slot + index + light) % 5 === 0 ? 0xe87521 : light === 0 ? 0x408982 : 0x6ca2a2);
        statusLeds.setColorAt(ledIndex, ledColor);
        ledIndex += 1;
      }
      unitIndex += 1;
    }

    for (let line = 0; line < 4; line += 1) {
      inner.position.set(-0.43, 0.8 + line * 0.76, rack.depth / 2 + 0.145);
      inner.scale.set(0.045, 0.4, 0.018);
      inner.updateMatrix();
      world.multiplyMatrices(outer.matrix, inner.matrix);
      ventilation.setMatrixAt(ventIndex, world);
      ventIndex += 1;
    }

    inner.position.set(0, 4.43, 0);
    inner.scale.set(rack.width + 0.1, 0.12, rack.depth + 0.1);
    inner.updateMatrix();
    world.multiplyMatrices(outer.matrix, inner.matrix);
    rackCaps.setMatrixAt(index, world);
  });
  for (const instances of [rackBody, rackDoor, rackCaps, serverUnits, ventilation, statusLeds]) {
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingSphere();
    scene.add(instances);
  }
}

function addCeilingLight(x, z, width = 2.5, depth = 0.45) {
  addMesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    new THREE.MeshBasicMaterial({ color: 0x6ca2a2 }),
    [x, 6.15, z]
  );
}

function addAisleSign(x, z, text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#14295e";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.fillRect(0, 0, 12, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "bold 42px sans-serif";
  context.fillText(text, 34, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = addMesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    [x, 4.25, z]
  );
  addMesh(
    new THREE.BoxGeometry(0.08, 1.35, 0.08),
    material(0x6ca2a2, 0.45, 0.25),
    [x, 4.65, z]
  );
}

function addCoolingWall(x, z, rotation = 0) {
  const unit = new THREE.Group();
  unit.position.set(x, 2.5, z);
  unit.rotation.y = rotation;
  addMesh(new THREE.BoxGeometry(4.8, 3.8, 1.25), material(0x203d60, 0.48, 0.28), [0, 0, 0], unit);
  const grilleMaterial = material(0x6ca2a2, 0.45, 0.25);
  for (let slot = -4; slot <= 4; slot += 1) {
    addMesh(new THREE.BoxGeometry(0.055, 2.45, 0.05), grilleMaterial, [slot * 0.25, 0, 0.66], unit);
  }
  for (const side of [-1, 1]) {
    const fan = addMesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16),
      material(0x14295e, 0.38, 0.35),
      [side * 1.72, 0, 0.7],
      unit
    );
    fan.rotation.x = Math.PI / 2;
    const rim = addMesh(
      new THREE.TorusGeometry(0.58, 0.055, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x408982 }),
      [side * 1.72, 0, 0.78],
      unit
    );
    rim.rotation.x = Math.PI / 2;
    for (let blade = 0; blade < 4; blade += 1) {
      const vane = addMesh(
        new THREE.BoxGeometry(0.08, 0.76, 0.045),
        grilleMaterial,
        [side * 1.72, 0, 0.78],
        unit
      );
      vane.rotation.z = blade * Math.PI / 2;
    }
  }
  unit.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
  colliders.push({ x, z, halfWidth: 2.6, halfDepth: 0.85 });
  scene.add(unit);
}

function addCable(points, color, opacity = 0.72) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map(([x, z]) => new THREE.Vector3(x, 0.035, z))
  );
  scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
}

function createFox() {
  const fox = new THREE.Group();
  const orange = material(0xe87521);
  const cream = material(0xf4eee3);
  const dark = material(0x56352e);
  foxBody = new THREE.Group();
  const body = addMesh(new THREE.CapsuleGeometry(0.34, 0.55, 3, 7), orange, [0, 0.91, 0], foxBody);
  body.scale.set(0.9, 1, 1.2);
  const chest = addMesh(new THREE.SphereGeometry(0.24, 10, 8), cream, [0, 0.88, 0.22], foxBody);
  chest.scale.set(0.8, 1.2, 0.55);
  const head = addMesh(new THREE.SphereGeometry(0.36, 12, 10), orange, [0, 1.68, 0.16], foxBody);
  head.scale.set(0.93, 0.9, 1);
  const muzzle = addMesh(new THREE.ConeGeometry(0.2, 0.47, 5), cream, [0, 1.52, 0.51], foxBody);
  muzzle.rotation.x = Math.PI / 2;
  const nose = addMesh(new THREE.SphereGeometry(0.07, 8, 6), dark, [0, 1.55, 0.73], foxBody);
  nose.scale.set(1, 0.75, 0.65);
  for (const side of [-1, 1]) {
    const ear = addMesh(new THREE.ConeGeometry(0.16, 0.45, 5), orange, [side * 0.23, 2.01, 0.1], foxBody);
    ear.rotation.z = -side * 0.12;
    const innerEar = addMesh(new THREE.ConeGeometry(0.075, 0.25, 5), material(0x815088), [side * 0.23, 2.03, 0.16], foxBody);
    innerEar.rotation.z = -side * 0.12;
    addMesh(new THREE.SphereGeometry(0.04, 6, 5), dark, [side * 0.14, 1.72, 0.48], foxBody);
  }
  foxTail = new THREE.Group();
  foxTail.position.set(0, 0.98, -0.34);
  const tail = addMesh(new THREE.ConeGeometry(0.29, 0.94, 7), orange, [0, 0, -0.42], foxTail);
  tail.rotation.x = -Math.PI / 2;
  const tip = addMesh(new THREE.SphereGeometry(0.2, 8, 6), cream, [0, 0, -0.81], foxTail);
  tip.scale.set(0.85, 0.85, 0.7);
  foxBody.add(foxTail);
  for (const x of [-0.15, 0.15]) {
    addMesh(new THREE.CapsuleGeometry(0.1, 0.3, 2, 5), material(0x203d60), [x, 0.28, 0], foxBody);
  }
  fox.add(foxBody);
  fox.position.set(0, 0, 0);
  scene.add(fox);
  return fox;
}

function addStation(index, station) {
  const group = new THREE.Group();
  group.position.set(station.position[0], 0, station.position[2]);
  const platform = addMesh(new THREE.CylinderGeometry(1.65, 1.85, 0.36, 10), material(0x203d60, 0.5, 0.2), [0, 0.18, 0], group);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: station.color,
    emissive: station.color,
    emissiveIntensity: 0.6,
    roughness: 0.35
  });
  const core = addMesh(new THREE.OctahedronGeometry(0.55), coreMaterial, [0, 1.45, 0], group);
  const ring = addMesh(
    new THREE.TorusGeometry(1.08, 0.04, 7, 32),
    new THREE.MeshBasicMaterial({ color: station.color, transparent: true, opacity: 0.75 }),
    [0, 0.75, 0],
    group
  );
  ring.rotation.x = Math.PI / 2;
  const beacon = addMesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.65, 5),
    new THREE.MeshBasicMaterial({ color: station.color }),
    [0, 2.5, 0],
    group
  );
  const beaconTop = addMesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshBasicMaterial({ color: station.color }),
    [0, 2.86, 0],
    group
  );
  scene.add(group);
  stationMeshes.push({ group, core, ring, beacon, beaconTop, platform, index });
}

function buildWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14295e);
  scene.fog = new THREE.Fog(0x14295e, 52, 100);
  camera = new THREE.PerspectiveCamera(52, 1, 0.1, 125);
  camera.position.set(0, 9, 13);
  camera.lookAt(0, 1, -2);

  scene.add(new THREE.HemisphereLight(0xd9e5ef, 0x14295e, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-10, 22, 12);
  scene.add(keyLight);

  addMesh(new THREE.PlaneGeometry(80, 80), material(0x203d60, 0.78), [0, -0.06, 0]).rotation.x = -Math.PI / 2;
  const gridPositions = [];
  for (let coordinate = -36; coordinate <= 36; coordinate += 4) {
    gridPositions.push(coordinate, 0.008, -36, coordinate, 0.008, 36);
    gridPositions.push(-36, 0.008, coordinate, 36, 0.008, coordinate);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
  scene.add(new THREE.LineSegments(
    gridGeometry,
    new THREE.LineBasicMaterial({ color: 0x6ca2a2, transparent: true, opacity: 0.045 })
  ));

  addBlock(0, 3.5, -38, 76, 7, 0.7, 0x14295e);
  addBlock(0, 3.5, 38, 76, 7, 0.7, 0x14295e);
  addBlock(-38, 3.5, 0, 0.7, 7, 76, 0x14295e);
  addBlock(38, 3.5, 0, 0.7, 7, 76, 0x14295e);

  const roofBeamMaterial = material(0x14295e, 0.45, 0.2);
  const roofGlow = new THREE.MeshBasicMaterial({ color: 0x6ca2a2 });
  for (const z of [-34, -20, -5, 10, 25, 35]) {
    addMesh(new THREE.BoxGeometry(72, 0.22, 0.32), roofBeamMaterial, [0, 7, z]);
    addMesh(new THREE.BoxGeometry(67, 0.04, 0.34), roofGlow, [0, 6.86, z]);
  }

  const rackRows = [
    { x: -31, start: -33, end: 34, gap: 5.5, angle: Math.PI / 2 },
    { x: -25, start: -30, end: 32, gap: 5.6, angle: Math.PI / 2 },
    { x: 25, start: -34, end: 32, gap: 5.5, angle: -Math.PI / 2 },
    { x: 31, start: -30, end: 33, gap: 5.6, angle: -Math.PI / 2 }
  ];
  rackRows.forEach((row) => {
    for (let z = row.start; z <= row.end; z += row.gap) addRack(row.x, z, row.angle);
  });
  for (const [z, positions] of [
    [-34, [-19, -13, -7, 7, 13, 19]],
    [-22, [-19, -14, 14, 19]],
    [-9, [-19, -14, 14, 19]],
    [8, [-19, -14, 14, 19]],
    [21, [-19, -14, 14, 19]],
    [34, [-19, -13, -7, 7, 13, 19]]
  ]) positions.forEach((x) => addRack(x, z, z < 0 ? 0 : Math.PI));

  const satelliteBanks = [
    { x: -17, z: [-29, -24, -19, -7, -2, 9, 14, 20, 28] },
    { x: 17, z: [-31, -26, -18, -13, -4, 3, 11, 20, 27] }
  ];
  satelliteBanks.forEach((bank) => {
    bank.z.forEach((z, index) => addRack(bank.x, z, index % 2 ? 0.08 : -0.08, 1.5, 1.25));
  });

  const floorVent = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    material(0x6ca2a2, 0.48, 0.22),
    28
  );
  const floorVentCover = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    material(0x14295e, 0.58, 0.18),
    28
  );
  const ventTransform = new THREE.Object3D();
  let ventTile = 0;
  for (const x of [-22, -11, 11, 22]) {
    for (const z of [-25, -10, 6, 23]) {
      ventTransform.position.set(x, 0.025, z);
      ventTransform.scale.set(2.2, 0.035, 0.85);
      ventTransform.updateMatrix();
      floorVent.setMatrixAt(ventTile, ventTransform.matrix);
      ventTransform.position.y = 0.05;
      ventTransform.scale.set(1.95, 0.025, 0.58);
      ventTransform.updateMatrix();
      floorVentCover.setMatrixAt(ventTile, ventTransform.matrix);
      ventTile += 1;
    }
  }
  floorVent.count = ventTile;
  floorVentCover.count = ventTile;
  scene.add(floorVent, floorVentCover);

  const lightPlacements = [
    [-20, -30, 3], [-9, -29, 3], [5, -31, 2.5], [20, -27, 3],
    [-19, -16, 2.5], [-5, -14, 3], [8, -17, 3], [20, -10, 2.5],
    [-19, 1, 3], [-6, 1, 2.5], [7, 3, 3], [20, 9, 3],
    [-18, 17, 2.5], [-5, 19, 3], [8, 17, 2.5], [20, 29, 3]
  ];
  lightPlacements.forEach(([x, z, width]) => addCeilingLight(x, z, width));

  addCoolingWall(-8, -36.3);
  addCoolingWall(8, -36.3);
  addCoolingWall(-8, 36.3, Math.PI);
  addCoolingWall(8, 36.3, Math.PI);
  addAisleSign(-10, -8, "AI / COMPUTE", "#e87521");
  addAisleSign(10, -5, "NETWORK", "#408982");
  addAisleSign(-10, 12, "STORAGE", "#815088");
  addAisleSign(10, 19, "OBSERVABILITY", "#6ca2a2");

  const cableMat = material(0x6ca2a2, 0.35, 0.6);
  for (const [x, z, length, across] of [
    [-22, -4, 18, false], [22, 6, 20, false], [-6, -22, 16, true],
    [7, 18, 14, true], [-23, 23, 10, true], [23, -24, 12, true]
  ]) {
    const pipe = addMesh(
      new THREE.CylinderGeometry(0.11, 0.11, length, 7),
      cableMat,
      [x, 5.35, z]
    );
    if (across) pipe.rotation.z = Math.PI / 2;
  }
  const trayMaterial = material(0x14295e, 0.42, 0.48);
  for (const [x, z, width, depth] of [
    [-20, -4, 0.32, 62], [20, 5, 0.32, 58], [-5, -20, 40, 0.32], [7, 16, 42, 0.32]
  ]) {
    addMesh(new THREE.BoxGeometry(width, 0.22, depth), trayMaterial, [x, 5.8, z]);
    addMesh(
      new THREE.BoxGeometry(width * 0.9, 0.045, depth * 0.42),
      new THREE.MeshBasicMaterial({ color: 0x408982 }),
      [x, 5.68, z]
    );
  }

  const aislePaint = new THREE.MeshBasicMaterial({ color: 0xe87521 });
  const aislePaintCool = new THREE.MeshBasicMaterial({ color: 0x6ca2a2 });
  for (const [z, length, mat] of [
    [-31, 62, aislePaintCool], [-19, 62, aislePaint], [-5, 62, aislePaintCool],
    [9, 62, aislePaint], [23, 62, aislePaintCool], [0, 46, aislePaint]
  ]) {
    const horizontal = Math.abs(z) > 0;
    addMesh(
      new THREE.BoxGeometry(horizontal ? length : 0.1, 0.018, horizontal ? 0.09 : 46),
      mat,
      [0, 0.024, z]
    );
  }
  for (const [x, z, width, height, color] of [
    [-35.8, -22, 0.06, 2.5, 0xe87521], [35.8, -5, 0.06, 2.5, 0x408982],
    [-35.8, 15, 0.06, 2.5, 0x815088], [35.8, 25, 0.06, 2.5, 0x6ca2a2]
  ]) {
    addMesh(
      new THREE.BoxGeometry(width, height, 0.04),
      new THREE.MeshBasicMaterial({ color }),
      [x, 3.2, z]
    );
  }

  addRackInstances();
  stations.forEach((station, index) => addStation(index, station));
  addCable([[0, 0], [-8, 0], [-8, -14], [-10, -14]], 0xe87521);
  addCable([[0, 0], [0, -27]], 0x6ca2a2);
  addCable([[0, 0], [8, 0], [8, -12], [10, -12]], 0x408982);
  addCable([[0, 0], [8, 0], [8, 15], [10, 15]], 0x815088);
  addCable([[0, 0], [-8, 0], [-8, 24], [-10, 24]], 0xe87521);
  player = createFox();

  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  canvasHost.append(renderer.domElement);
  resizeWorld();
  window.addEventListener("resize", resizeWorld);
  renderer.setAnimationLoop(animate);
}

function resizeWorld() {
  if (!renderer || !camera) return;
  const width = canvasHost.clientWidth;
  const height = canvasHost.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function isBlocked(x, z) {
  if (Math.abs(x) > 36 || Math.abs(z) > 36) return true;
  return colliders.some((collider) =>
    Math.abs(x - collider.x) < collider.halfWidth + 0.32 &&
    Math.abs(z - collider.z) < collider.halfDepth + 0.32
  );
}

function movementState() {
  return {
    forward: pressedKeys.has("w") || pressedKeys.has("arrowup") || touchDirections.has("forward"),
    back: pressedKeys.has("s") || pressedKeys.has("arrowdown") || touchDirections.has("back"),
    left: pressedKeys.has("a") || pressedKeys.has("arrowleft") || touchDirections.has("left"),
    right: pressedKeys.has("d") || pressedKeys.has("arrowright") || touchDirections.has("right")
  };
}

function jump() {
  if (!gameStarted || !isGrounded || activityDialog.open) return;
  verticalVelocity = 7.5;
  isGrounded = false;
}

function updateMovement(delta, time) {
  if (!gameStarted || activityDialog.open) return false;
  const frameDelta = Math.min(delta, 0.05);
  const input = movementState();
  const dx = Number(input.right) - Number(input.left);
  const dz = Number(input.back) - Number(input.forward);
  const magnitude = Math.hypot(dx, dz);
  let moved = false;
  if (magnitude) {
    const speed = 5.2 * frameDelta;
    const moveX = dx / magnitude * speed;
    const moveZ = dz / magnitude * speed;
    const nextX = player.position.x + moveX;
    const nextZ = player.position.z + moveZ;
    if (!isBlocked(nextX, player.position.z)) player.position.x = nextX;
    if (!isBlocked(player.position.x, nextZ)) player.position.z = nextZ;
    player.rotation.y = Math.atan2(moveX, moveZ);
    foxTail.rotation.x = Math.sin(time * 0.009) * 0.16;
    moved = true;
  }
  if (!isGrounded) {
    verticalVelocity -= 20 * frameDelta;
    player.position.y += verticalVelocity * frameDelta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      verticalVelocity = 0;
      isGrounded = true;
    }
    moved = true;
  }
  foxBody.position.y = player.position.y + (magnitude && isGrounded ? Math.abs(Math.sin(time * 0.012)) * 0.07 : 0);
  return moved;
}

function updateStations(time) {
  let nearestIndex = -1;
  let nearestDistance = Infinity;
  stationMeshes.forEach((station) => {
    const distance = Math.hypot(
      player.position.x - station.group.position.x,
      player.position.z - station.group.position.z
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = station.index;
    }
    station.core.position.y = 1.45 + Math.sin(time * 0.0018 + station.index) * 0.12;
    station.core.rotation.y = time * 0.0005;
    station.beacon.position.y = 2.5 + Math.sin(time * 0.002 + station.index) * 0.08;
    station.beaconTop.position.y = station.beacon.position.y + 0.36;
    station.ring.material.opacity = 0.5 + (Math.sin(time * 0.003 + station.index) + 1) * 0.16;
    stationListItems[station.index].classList.toggle("is-near", distance < 3.4);
    stationListItems[station.index].classList.toggle("is-complete", completedStations.has(station.index));
  });
  const nextStation = nearestDistance < 3.5 ? nearestIndex : -1;
  interactionPrompt.hidden = nextStation < 0;
  if (nextStation === activeStation) return;
  activeStation = nextStation;
  locationTitle.textContent = activeStation < 0 ? "Sala di controllo" : stations[activeStation].name;
  locationDescription.textContent = activeStation < 0
    ? "Avvicinati a un nodo luminoso per scoprire una decisione."
    : completedStations.has(activeStation)
      ? "Stazione completata. Puoi ripetere l’attività."
      : `Stazione ${String(activeStation + 1).padStart(2, "0")} · ${stations[activeStation].shortName}`;
}

function animate(time) {
  const delta = lastFrame ? (time - lastFrame) / 1000 : 0;
  lastFrame = time;
  const foxMoved = updateMovement(delta, time);
  updateStations(time);
  if (player) {
    const desiredCamera = new THREE.Vector3(player.position.x, 9, player.position.z + 13);
    const factor = 1 - Math.exp(-4.5 * Math.min(delta, 0.05));
    camera.position.lerp(desiredCamera, factor);
    camera.lookAt(player.position.x, 1, player.position.z - 1.5);
  }
  if (foxMoved || time - lastRender >= 33) {
    lastRender = time;
    renderer.render(scene, camera);
  }
}

function openActivity(index) {
  if (index < 0 || index >= activities.length) return;
  currentActivity = index;
  const activity = activities[index];
  document.querySelector("#activity-kicker").textContent = `STAZIONE ${String(index + 1).padStart(2, "0")} / 05`;
  document.querySelector("#activity-tag").textContent = activity.tag;
  document.querySelector("#activity-title").textContent = activity.title;
  document.querySelector("#activity-copy").textContent = activity.copy;
  document.querySelector("#scenario-card").textContent = activity.scenario;
  document.querySelector("#question-label").textContent = activity.question;
  answerContainer.replaceChildren(...activity.options.map((option, optionIndex) => {
    const label = document.createElement("label");
    label.className = "answer-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "activity-answer";
    input.value = String(optionIndex);
    const text = document.createElement("span");
    text.textContent = option;
    label.append(input, text);
    return label;
  }));
  feedbackBox.hidden = true;
  feedbackBox.classList.remove("is-miss");
  checkAnswerButton.hidden = false;
  continueButton.hidden = true;
  activityDialog.showModal();
}

function persistProgress() {
  try {
    localStorage.setItem("green-code-game-progress", JSON.stringify([...completedStations]));
  } catch (error) {
    console.warn("Impossibile salvare i progressi della missione.", error);
  }
}

function checkAnswer() {
  const selected = answerContainer.querySelector('input[name="activity-answer"]:checked');
  if (!selected) {
    feedbackBox.textContent = "Scegli una risposta per continuare.";
    feedbackBox.classList.add("is-miss");
    feedbackBox.hidden = false;
    return;
  }
  const activity = activities[currentActivity];
  const correct = Number(selected.value) === activity.answer;
  completedStations.add(currentActivity);
  progressCount.textContent = `${completedStations.size} / ${activities.length}`;
  progressFill.style.width = `${completedStations.size / activities.length * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(completedStations.size));
  stationListItems[currentActivity].classList.add("is-complete");
  feedbackBox.textContent = `${correct ? "Scelta centrata." : "C’è un aspetto da tenere a mente."} ${activity.feedback}`;
  feedbackBox.classList.toggle("is-miss", !correct);
  feedbackBox.hidden = false;
  checkAnswerButton.hidden = true;
  continueButton.hidden = false;
  persistProgress();
}

function bindTouch(button, direction) {
  const setPressed = (pressed) => {
    if (pressed) touchDirections.add(direction);
    else touchDirections.delete(direction);
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setPressed(true);
  });
  button.addEventListener("pointerup", () => setPressed(false));
  button.addEventListener("pointercancel", () => setPressed(false));
  button.addEventListener("lostpointercapture", () => setPressed(false));
}

async function startGame() {
  if (renderer) {
    gameStarted = true;
    startButton.hidden = true;
    canvasHost.focus({ preventScroll: true });
    return;
  }
  startButton.disabled = true;
  startButton.querySelector("b").textContent = "Caricamento della mappa…";
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
    buildWorld();
    gameStarted = true;
    startButton.hidden = true;
    canvasHost.focus({ preventScroll: true });
  } catch (error) {
    console.error("Impossibile avviare la mappa 3D.", error);
    startButton.disabled = false;
    startButton.querySelector("b").textContent = "Riprova a entrare";
    showError("La mappa 3D non è disponibile. Controlla la connessione e riprova.");
  }
}

startButton.addEventListener("click", startGame);
interactButton.addEventListener("click", () => openActivity(activeStation));
checkAnswerButton.addEventListener("click", checkAnswer);
closeActivity.addEventListener("click", () => activityDialog.close());
continueButton.addEventListener("click", () => {
  activityDialog.close();
  if (completedStations.size === activities.length) {
    locationTitle.textContent = "Missione completata!";
    locationDescription.textContent = "Hai esplorato tutte le decisioni. Ora puoi portarle nel team.";
  }
});
activityDialog.addEventListener("click", (event) => {
  if (event.target === activityDialog) activityDialog.close();
});
activityDialog.addEventListener("close", () => {
  pressedKeys.clear();
  touchDirections.clear();
});
document.querySelectorAll("[data-move]").forEach((button) => bindTouch(button, button.dataset.move));
document.querySelector("#jump-button").addEventListener("click", jump);
canvasHost.addEventListener("pointerdown", () => canvasHost.focus({ preventScroll: true }));

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (event.code === "Space" && gameStarted && !activityDialog.open) {
    event.preventDefault();
    if (!event.repeat) jump();
  }
  if (movementKeys.has(key) && gameStarted && !activityDialog.open) {
    event.preventDefault();
    pressedKeys.add(key);
  }
  if ((key === "e" || key === "enter") && activeStation >= 0 && gameStarted && !activityDialog.open) openActivity(activeStation);
  if (key === "escape" && activityDialog.open) activityDialog.close();
}, true);
window.addEventListener("keyup", (event) => pressedKeys.delete(event.key.toLowerCase()), true);
window.addEventListener("blur", () => {
  pressedKeys.clear();
  touchDirections.clear();
});

try {
  const savedProgress = JSON.parse(localStorage.getItem("green-code-game-progress") || "[]");
  savedProgress.forEach((index) => {
    if (Number.isInteger(index) && index >= 0 && index < activities.length) completedStations.add(index);
  });
} catch (error) {
  console.warn("Il salvataggio dei progressi non è disponibile in questo browser.", error);
}
if (completedStations.size) {
  progressCount.textContent = `${completedStations.size} / ${activities.length}`;
  progressFill.style.width = `${completedStations.size / activities.length * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(completedStations.size));
  completedStations.forEach((index) => stationListItems[index].classList.add("is-complete"));
}
