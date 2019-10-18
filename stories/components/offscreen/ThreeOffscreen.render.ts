import * as THREE from 'three';
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let group: THREE.Group;
let seed = 1;
function random() {
  const x = Math.sin(seed ++) * 10000;
  return x - Math.floor(x);
}

function animate() {
  group.rotation.y = - Date.now() / 4000;
  renderer.render(scene, camera);
  if (requestAnimationFrame) {
    requestAnimationFrame(animate);
  }
}

export function initThree(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  pixelRatio: number,
  texturePath: string,
  basePath?: string,
) {
  camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
  camera.position.z = 200;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x444466, 100, 400);
  scene.background = new THREE.Color(0x444466);

  group = new THREE.Group();
  scene.add(group);

  // we don't use ImageLoader since it has a DOM dependency (HTML5 image element)
  const loader = new THREE.ImageBitmapLoader().setPath(basePath || '');
  loader.setOptions({ imageOrientation: 'flipY' });
  loader.load(texturePath, (imageBitmap: any) => {

    const texture = new THREE.CanvasTexture(imageBitmap);

    const geometry = new THREE.IcosahedronBufferGeometry(5, 3);
    const materials = [
      new THREE.MeshMatcapMaterial({ color: 0xaa24df, matcap: texture }),
      new THREE.MeshMatcapMaterial({ color: 0x605d90, matcap: texture }),
      new THREE.MeshMatcapMaterial({ color: 0xe04a3f, matcap: texture }),
      new THREE.MeshMatcapMaterial({ color: 0xe30456, matcap: texture }),
    ];

    for (let i = 0; i < 100; i ++) {
      const material = materials[i % materials.length];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = random() * 200 - 100;
      mesh.position.y = random() * 200 - 100;
      mesh.position.z = random() * 200 - 100;
      mesh.scale.setScalar(random() + 1);
      group.add(mesh);
    }

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    animate();
  }, (progress: ProgressEvent) => {
    console.log(progress);
  }, (error: ErrorEvent) => {
    console.log(error);
  });
}

export function resizeRenderer(w: number, h: number, updateStyle?: boolean) {
  renderer && renderer.setSize(w, h, updateStyle);
}
