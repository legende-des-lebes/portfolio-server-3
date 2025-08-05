// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cylinder creation
const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const cylinder = new THREE.Mesh(geometry, material);
cylinder.name = "FloatingCylinder";
scene.add(cylinder);

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Camera position
camera.position.z = 5;

// Floating animation
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  cylinder.position.y = Math.sin(t) * 0.5; // Float up and down
  cylinder.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// Handle click
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0 && intersects[0].object.name === "FloatingCylinder") {
    window.location.href = "student.html";
  }
});
