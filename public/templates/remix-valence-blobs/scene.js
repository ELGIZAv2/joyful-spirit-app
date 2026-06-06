import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// SDF Sphere Blending - Raymarched with GLSL ShaderMaterial
// Seven colored spheres smoothly blending via polynomial smooth-min

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.domElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none;';
document.body.appendChild(renderer.domElement);

// Load HDRI environment map
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let envTexture = null;

new HDRLoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
  function(hdrTexture) {
    const envMap = pmremGenerator.fromEquirectangular(hdrTexture);
    envTexture = envMap.texture;
    material.uniforms.uEnvMap.value = envTexture;
    material.uniforms.uEnvMapReady.value = 1.0;
    hdrTexture.dispose();
    pmremGenerator.dispose();
  }
);

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform samplerCube uEnvMap;
  uniform float uEnvMapReady;
  uniform vec3 uMouse;
  uniform float uRoughness;
  uniform float uBlend;
  uniform float uSpecular;
  uniform float uSubsurface;
  uniform float uAmbient;
  uniform float uColorSharpness;
  uniform float uReflectionStrength;
  uniform vec3 uBgColor;

  // Polynomial smooth min
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // Sphere SDF
  float sdSphere(vec3 p, vec3 center, float radius) {
    return length(p - center) - radius;
  }

  // Repel sphere center away from mouse position
  vec3 repelFromMouse(vec3 center) {
    vec3 diff = center - uMouse;
    float dist = length(diff);
    float repelRadius = 2.0;
    float repelStrength = 1.8;
    if (dist < repelRadius && dist > 0.001) {
      float force = repelStrength * (1.0 - dist / repelRadius);
      force = force * force; // quadratic falloff for smoother feel
      center += normalize(diff) * force;
    }
    return center;
  }

  // Sphere centers (animated)
  vec3 getCenter(int i, float t) {
    vec3 c;
    if (i == 0) c = vec3(sin(t*0.7)*1.2, cos(t*0.5)*0.8, sin(t*0.3)*0.5);
    else if (i == 1) c = vec3(cos(t*0.6)*1.0, sin(t*0.8)*1.0, cos(t*0.4)*0.6);
    else if (i == 2) c = vec3(sin(t*0.9)*0.8, -sin(t*0.4)*1.2, sin(t*0.7)*0.4);
    else if (i == 3) c = vec3(-cos(t*0.5)*1.5, cos(t*0.7)*0.6, cos(t*0.5)*0.3);
    else if (i == 4) c = vec3(sin(t*0.4)*0.6, sin(t*1.0)*0.5, -sin(t*0.6)*0.7);
    else if (i == 5) c = vec3(0.0, 0.0, 0.0);
    else c = vec3(cos(t*0.8)*1.8, -sin(t*0.3)*0.4, cos(t*0.9)*0.5);
    return repelFromMouse(c);
  }

  float getRadius(int i) {
    if (i == 0) return 0.6;
    if (i == 1) return 0.55;
    if (i == 2) return 0.5;
    if (i == 3) return 0.45;
    if (i == 4) return 0.65;
    if (i == 5) return 0.7;
    return 0.4;
  }

  vec3 getColor(int i) {
    if (i == 0) return vec3(1.0, 0.2, 0.3);   // Red-pink
    if (i == 1) return vec3(0.2, 0.6, 1.0);   // Blue
    if (i == 2) return vec3(0.1, 1.0, 0.5);   // Green
    if (i == 3) return vec3(1.0, 0.8, 0.1);   // Yellow
    if (i == 4) return vec3(0.8, 0.2, 1.0);   // Purple
    if (i == 5) return vec3(1.0, 0.5, 0.1);   // Orange
    return vec3(0.1, 0.9, 0.9);               // Cyan
  }

  // Precomputed sphere data for current frame
  struct SphereData {
    vec3 center;
    float radius;
    vec3 color;
  };

  SphereData getSphereData(int i) {
    SphereData s;
    s.center = getCenter(i, uTime);
    s.radius = getRadius(i);
    s.color = getColor(i);
    return s;
  }

  // Scene SDF and color combined (single pass to avoid redundant getCenter calls)
  float sceneSDF(vec3 p) {
    float k = uBlend;
    float d = sdSphere(p, getCenter(0, uTime), getRadius(0));
    d = smin(d, sdSphere(p, getCenter(1, uTime), getRadius(1)), k);
    d = smin(d, sdSphere(p, getCenter(2, uTime), getRadius(2)), k);
    d = smin(d, sdSphere(p, getCenter(3, uTime), getRadius(3)), k);
    d = smin(d, sdSphere(p, getCenter(4, uTime), getRadius(4)), k);
    d = smin(d, sdSphere(p, getCenter(5, uTime), getRadius(5)), k);
    d = smin(d, sdSphere(p, getCenter(6, uTime), getRadius(6)), k);
    return d;
  }

  // Blended color at point
  vec3 sceneColor(vec3 p) {
    float sharpness = uColorSharpness;
    vec3 totalColor = vec3(0.0);
    float totalWeight = 0.0;
    float d0 = length(p - getCenter(0, uTime)) - getRadius(0);
    float d1 = length(p - getCenter(1, uTime)) - getRadius(1);
    float d2 = length(p - getCenter(2, uTime)) - getRadius(2);
    float d3 = length(p - getCenter(3, uTime)) - getRadius(3);
    float d4 = length(p - getCenter(4, uTime)) - getRadius(4);
    float d5 = length(p - getCenter(5, uTime)) - getRadius(5);
    float d6 = length(p - getCenter(6, uTime)) - getRadius(6);
    float w0 = exp(-d0 * sharpness); totalColor += getColor(0)*w0; totalWeight += w0;
    float w1 = exp(-d1 * sharpness); totalColor += getColor(1)*w1; totalWeight += w1;
    float w2 = exp(-d2 * sharpness); totalColor += getColor(2)*w2; totalWeight += w2;
    float w3 = exp(-d3 * sharpness); totalColor += getColor(3)*w3; totalWeight += w3;
    float w4 = exp(-d4 * sharpness); totalColor += getColor(4)*w4; totalWeight += w4;
    float w5 = exp(-d5 * sharpness); totalColor += getColor(5)*w5; totalWeight += w5;
    float w6 = exp(-d6 * sharpness); totalColor += getColor(6)*w6; totalWeight += w6;
    return totalColor / totalWeight;
  }

  // Normal via tetrahedron technique (4 samples instead of 6)
  vec3 calcNormal(vec3 p) {
    float e = 0.003;
    vec2 h = vec2(e, -e);
    return normalize(
      h.xyy * sceneSDF(p + h.xyy) +
      h.yyx * sceneSDF(p + h.yyx) +
      h.yxy * sceneSDF(p + h.yxy) +
      h.xxx * sceneSDF(p + h.xxx)
    );
  }

  // Sample HDRI environment map via cubemap
  vec3 sampleEnv(vec3 dir) {
    if (uEnvMapReady > 0.5) {
      vec3 envColor = textureCube(uEnvMap, dir).rgb;
      return envColor;
    }
    // Fallback grey gradient while loading
    float g = mix(0.08, 0.18, dir.y * 0.5 + 0.5);
    return vec3(g);
  }

  // Sample with roughness blur approximation (5 taps instead of 10)
  vec3 sampleEnvBlur(vec3 dir, float roughness) {
    if (roughness < 0.01) return sampleEnv(dir);
    vec3 up = abs(dir.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, dir));
    vec3 bitangent = cross(dir, tangent);
    
    float r = roughness * 0.35;
    vec3 result = sampleEnv(dir) * 2.0;
    result += sampleEnv(normalize(dir + tangent * r));
    result += sampleEnv(normalize(dir - bitangent * r));
    return result / 4.0;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= aspect;

    // Ray setup
    vec3 ro = vec3(0.0, 0.0, -5.0);
    vec3 rd = normalize(vec3(uv, 1.5));

    // Raymarching
    float totalDist = 0.0;
    bool hit = false;
    vec3 hitPos;

    for (int i = 0; i < 36; i++) {
      vec3 p = ro + rd * totalDist;
      float d = sceneSDF(p);
      totalDist += d;
      if (d < 0.003) {
        hit = true;
        hitPos = p;
        break;
      }
      if (totalDist > 12.0) break;
    }

    vec3 finalColor;

    if (hit) {
      vec3 normal = calcNormal(hitPos);
      vec3 baseColor = sceneColor(hitPos);
      vec3 viewDir = -rd;

      // Key light
      vec3 lightDir1 = normalize(vec3(2.0, 3.0, -2.0));
      float diff1 = max(dot(normal, lightDir1), 0.0);

      // Roughness affects specular power and intensity
      float roughness = uRoughness;
      float specPower = mix(128.0, 4.0, roughness);
      float specAtten = (1.0 - roughness) * (1.0 - roughness);

      // Blinn-Phong specular
      vec3 halfDir = normalize(lightDir1 + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), specPower) * uSpecular * specAtten;

      // Fresnel
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
      vec3 specColor = mix(vec3(1.0), baseColor, fresnel * 0.3);

      // Environment map reflection
      vec3 reflectDir = reflect(-viewDir, normal);
      
      vec3 envBlurred = sampleEnvBlur(reflectDir, roughness);
      
      // Fresnel-weighted reflection, attenuated by roughness
      float reflectStrength = mix(0.4, 1.0, fresnel) * mix(1.0, 0.15, roughness);
      vec3 reflectionColor = envBlurred * reflectStrength * uReflectionStrength;

      float ao = 1.0;

      // Subsurface scattering approximation
      // Wrap lighting: light wraps around the surface
      float wrapDiffuse = max(0.0, (dot(normal, lightDir1) + 0.5) / 1.5);
      float backScatter = pow(clamp(dot(viewDir, -lightDir1), 0.0, 1.0), 2.0);
      // Thickness approximation: thinner at edges (more SSS)
      float thickness = clamp(1.0 - fresnel, 0.0, 1.0);
      float sss = (wrapDiffuse * 0.6 + backScatter * 0.8 + thickness * 0.4) * uSubsurface;
      vec3 sssColor = baseColor * vec3(1.2, 0.9, 0.85); // warm tint for SSS

      // Diffuse is softened by roughness for a more matte look
      float ambient = uAmbient;
      finalColor = baseColor * (diff1 + ambient)
                  + specColor * spec
                  + sssColor * sss
                  + reflectionColor * baseColor * 1.0
                  + reflectionColor * vec3(0.8) * fresnel;
    } else {
      // Background uses environment map blended with user bg color
      vec3 envBg = sampleEnv(rd) * 0.6;
      finalColor = mix(uBgColor, envBg, 0.3);
    }

    // ACES-ish tonemapping
    vec3 a = finalColor * (finalColor * 2.51 + 0.03);
    vec3 b = finalColor * (finalColor * 2.43 + 0.59) + 0.14;
    vec3 tonemapped = clamp(a / b, 0.0, 1.0);

    // Gamma correction
    finalColor = pow(tonemapped, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uEnvMap: { value: null },
    uEnvMapReady: { value: 0.0 },
    uMouse: { value: new THREE.Vector3(0.0, 0.0, -10.0) },
    uRoughness: { value: 0.0 },
    uBlend: { value: 1.2 },
    uSpecular: { value: 0.0 },
    uSubsurface: { value: 1.0 },
    uAmbient: { value: 0.25 },
    uColorSharpness: { value: 3.0 },
    uReflectionStrength: { value: 1.5 },
    uBgColor: { value: new THREE.Color(0xd4d4d8) }
  }
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
quad.name = 'sdfQuad';
scene.add(quad);

const clock = new THREE.Clock();

function animate() {
  // replaced by animateWithMouse below
}

// --- Scrollable Page Wrapper ---
const page = document.createElement('div');
page.style.cssText = `
  position: relative;
  z-index: 20;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #000;
`;
document.body.appendChild(page);

// --- Landing Page Overlay (fixed hero section) ---
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 15;
  overflow: hidden;
`;

// Hero
const hero = document.createElement('div');
hero.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: all;
  width: 100%;
  max-width: 760px;
  padding: 0 20px;
  box-sizing: border-box;
  margin-top: -20px;
`;

const eyebrow = document.createElement('div');
eyebrow.textContent = 'Molecular Intelligence';
eyebrow.style.cssText = `
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.5);
  margin-bottom: 24px;
`;

const headline = document.createElement('h1');
headline.innerHTML = 'Matter at its<br>most fundamental';
headline.style.cssText = `
  font-family: 'Inter', sans-serif;
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin: 0 0 24px;
  color: #000;
`;

const sub = document.createElement('p');
sub.textContent = 'Exploring the invisible architecture of chemical bonds, reactions, and the structures that define all known matter.';
sub.style.cssText = `
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: rgba(0,0,0,0.55);
  max-width: 440px;
  margin: 0 auto 40px;
`;

hero.appendChild(eyebrow);
hero.appendChild(headline);
hero.appendChild(sub);
overlay.appendChild(hero);

// Stats bar at bottom
const statsBar = document.createElement('div');
statsBar.style.cssText = `
  position: absolute;
  bottom: 0; left: 0; right: 0;
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 20px 16px;
  border-top: 1px solid rgba(0,0,0,0.08);
  pointer-events: all;
  overflow: hidden;
`;

[
  ['118', 'Known Elements'],
  ['∞', 'Compounds'],
  ['1869', 'Periodic Table'],
  ['7', 'Shells'],
].forEach(([val, label], i) => {
  const item = document.createElement('div');
  item.style.cssText = `text-align: center; flex: 1; min-width: 0; ${i > 0 ? 'border-left: 1px solid rgba(0,0,0,0.1);' : ''}`;

  const v = document.createElement('div');
  v.textContent = val;
  v.style.cssText = 'font-size: clamp(16px, 4vw, 24px); font-weight: 700; letter-spacing: -0.02em; color: #000;';

  const l = document.createElement('div');
  l.textContent = label;
  l.style.cssText = 'font-size: clamp(7px, 1.8vw, 9px); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.4); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';

  item.appendChild(v);
  item.appendChild(l);
  statsBar.appendChild(item);
});

overlay.appendChild(statsBar);
document.body.appendChild(overlay);

// ─── HERO SPACER (makes the page scrollable past the canvas) ───
const heroSpacer = document.createElement('div');
heroSpacer.style.cssText = 'height: 100vh; pointer-events: none; position: relative; z-index: 20;';
page.appendChild(heroSpacer);

// Fade out the fixed hero overlay as user scrolls past it
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const fadeStart = window.innerHeight * 0.15;
  const fadeEnd = window.innerHeight * 0.55;
  const opacity = 1 - Math.min(Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0), 1);
  overlay.style.opacity = opacity;
  overlay.style.pointerEvents = opacity < 0.05 ? 'none' : '';
});

// ─── HELPER: create a full-width section ───
function makeSection(bgColor, content) {
  const section = document.createElement('section');
  section.style.cssText = `
    position: relative;
    width: 100%;
    background: ${bgColor};
    pointer-events: all;
    z-index: 20;
  `;
  section.innerHTML = content;
  page.appendChild(section);
  return section;
}

// ─── SECTION 1: INTRO ───
makeSection('#ffffff', `
  <style>
    @media (max-width: 700px) {
      .intro-inner { flex-direction: column !important; gap: 48px !important; padding: 80px 24px !important; }
      .intro-grid { grid-template-columns: 1fr !important; }
    }
  </style>
  <div class="intro-inner" style="max-width:960px; margin:0 auto; padding:120px 48px; display:flex; gap:80px; align-items:flex-start;">
    <div style="flex:1; min-width:0;">
      <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:20px;">What We Do</div>
      <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 24px; color:#000;">
        Decoding the<br>language of molecules
      </h2>
      <p style="font-size:14px; line-height:1.8; color:rgba(0,0,0,0.55); max-width:400px; margin:0;">
        At Valence, we combine computational chemistry with machine learning to understand how atoms bond, 
        react, and form the structures that underpin all biological and material systems.
      </p>
    </div>
    <div class="intro-grid" style="flex:1; min-width:0; display:grid; grid-template-columns:1fr 1fr; gap:1px; background:rgba(0,0,0,0.08);">
      ${[
        ['Quantum Modeling','Simulating electron density and orbital geometries at the ab initio level.'],
        ['Reaction Mapping','Tracing reaction pathways and transition states across molecular graphs.'],
        ['Material Synthesis','Predicting novel compounds with target electronic or mechanical properties.'],
        ['Drug Discovery','Screening billions of candidate molecules for receptor binding affinity.'],
      ].map(([t,d]) => `
        <div style="background:#fff; padding:28px 24px;">
          <div style="font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#000; margin-bottom:12px;">${t}</div>
          <div style="font-size:12px; line-height:1.75; color:rgba(0,0,0,0.5);">${d}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 2: ELEMENTS GRID ───
const elements = [
  ['H','Hydrogen','1','1s¹'],['C','Carbon','6','[He] 2s² 2p²'],
  ['N','Nitrogen','7','[He] 2s² 2p³'],['O','Oxygen','8','[He] 2s² 2p⁴'],
  ['Fe','Iron','26','[Ar] 3d⁶ 4s²'],['Au','Gold','79','[Xe] 4f¹⁴ 5d¹⁰ 6s¹'],
];
makeSection('#f5f5f4', `
  <style>
    @media (max-width: 600px) {
      .elements-wrap { padding: 80px 24px !important; }
      .elements-wrap h2 { margin-bottom: 40px !important; }
    }
  </style>
  <div class="elements-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">Elements</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#000;">
      Building blocks of<br>everything
    </h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:1px; background:rgba(0,0,0,0.1);">
      ${elements.map(([sym,name,num,cfg]) => `
        <div style="background:#f5f5f4; padding:24px 18px; transition:background 0.2s;"
             onmouseenter="this.style.background='#fff'"
             onmouseleave="this.style.background='#f5f5f4'">
          <div style="font-size:clamp(28px,5vw,36px); font-weight:700; letter-spacing:-0.03em; color:#000; line-height:1;">${sym}</div>
          <div style="font-size:9px; color:rgba(0,0,0,0.35); margin-top:4px; letter-spacing:0.06em; text-transform:uppercase;">${name}</div>
          <div style="font-size:9px; color:rgba(0,0,0,0.25); margin-top:14px; font-family:monospace;">${cfg}</div>
          <div style="font-size:9px; color:rgba(0,0,0,0.25); margin-top:2px; letter-spacing:0.04em;">Z = ${num}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 3: RESEARCH PAPERS ───
const papers = [
  ['2024','Topological Graph Networks for Molecular Property Prediction','Nature Chemistry','Valence Research Lab'],
  ['2024','Smooth-Minima Potential Energy Surfaces in Transition State Theory','J. Chemical Physics','Valence & MIT'],
  ['2023','Electron Density Estimation via Diffusion Models','NeurIPS','Valence AI'],
  ['2023','Automated Retrosynthesis with Transformer-Based Path Planning','JACS','Valence & Stanford'],
];
makeSection('#fff', `
  <style>
    @media (max-width: 600px) {
      .papers-wrap { padding: 80px 24px !important; }
      .papers-wrap h2 { margin-bottom: 40px !important; }
      .paper-row { gap: 16px !important; padding: 24px 0 !important; }
      .paper-year { display: none !important; }
      .paper-arrow { display: none !important; }
    }
  </style>
  <div class="papers-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">Research</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#000;">
      Latest papers
    </h2>
    <div style="display:flex; flex-direction:column;">
      ${papers.map(([year,title,journal,authors],i) => `
        <div class="paper-row" style="display:flex; gap:40px; align-items:flex-start; padding:32px 0; ${i>0?'border-top:1px solid rgba(0,0,0,0.08);':''} cursor:pointer; transition:opacity 0.2s;"
             onmouseenter="this.style.opacity='0.6'" onmouseleave="this.style.opacity='1'">
          <div class="paper-year" style="font-size:11px; color:rgba(0,0,0,0.3); letter-spacing:0.06em; min-width:40px; padding-top:4px;">${year}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:clamp(13px,3vw,15px); font-weight:600; letter-spacing:-0.01em; color:#000; margin-bottom:8px;">${title}</div>
            <div style="font-size:11px; color:rgba(0,0,0,0.4); letter-spacing:0.04em;">${journal} · ${authors}</div>
          </div>
          <div class="paper-arrow" style="font-size:16px; color:rgba(0,0,0,0.2); padding-top:2px; flex-shrink:0;">→</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 4: TEAM ───
makeSection('#f5f5f4', `
  <style>
    @media (max-width: 700px) {
      .team-wrap { padding: 80px 24px !important; }
      .team-grid { grid-template-columns: 1fr 1fr !important; }
    }
  </style>
  <div class="team-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">People</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#000;">
      The team behind<br>the science
    </h2>
    <div class="team-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(0,0,0,0.08);">
      ${[
        ['Dr. Elena Voss','Computational Chemistry','ex-CERN, MIT PhD'],
        ['James Okafor','Machine Learning','ex-DeepMind, Stanford'],
        ['Dr. Lena Park','Quantum Physics','Caltech PhD, 38 papers'],
        ['Marco Reyes','Software Infrastructure','ex-Stripe, CMU'],
        ['Dr. Aisha Karim','Organic Synthesis','Oxford PhD, ex-Pfizer'],
        ['Tom Whitfield','Data Science','ex-Google Brain, UCL'],
        ['Dr. Yuki Tanaka','Materials Science','Tokyo Univ. PhD'],
        ['Sara Müller','Product & Strategy','ex-BCG, ETH Zürich'],
      ].map(([name,role,bg]) => `
        <div style="background:#f5f5f4; padding:28px 20px; transition:background 0.2s;"
             onmouseenter="this.style.background='#fff'"
             onmouseleave="this.style.background='#f5f5f4'">
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(0,0,0,0.08); margin-bottom:16px;"></div>
          <div style="font-size:12px; font-weight:600; color:#000; margin-bottom:4px;">${name}</div>
          <div style="font-size:10px; letter-spacing:0.05em; text-transform:uppercase; color:rgba(0,0,0,0.4); margin-bottom:8px;">${role}</div>
          <div style="font-size:10px; color:rgba(0,0,0,0.3);">${bg}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 5: PERIODIC TABLE EXCERPT ───
makeSection('#fff', `
  <style>
    @media (max-width: 600px) {
      .pt-wrap { padding: 80px 24px !important; }
      .pt-grid { gap: 6px !important; }
      .pt-cell { padding: 10px 8px !important; }
    }
  </style>
  <div class="pt-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">Periodic Table</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 16px; color:#000;">
      118 known elements
    </h2>
    <p style="font-size:14px; line-height:1.8; color:rgba(0,0,0,0.45); max-width:500px; margin:0 0 48px;">
      From hydrogen to oganesson, every element tells a story of atomic structure, reactivity, and the forces that hold matter together.
    </p>
    <div class="pt-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(80px,1fr)); gap:8px;">
      ${[
        ['H','1','#e8f4fd'],['He','2','#fef9e7'],['Li','3','#fdebd0'],['Be','4','#fdebd0'],
        ['B','5','#eafaf1'],['C','6','#eafaf1'],['N','7','#eafaf1'],['O','8','#eafaf1'],
        ['F','9','#eafaf1'],['Ne','10','#fef9e7'],['Na','11','#fdebd0'],['Mg','12','#fdebd0'],
        ['Al','13','#f2f3f4'],['Si','14','#f2f3f4'],['P','15','#eafaf1'],['S','16','#eafaf1'],
        ['Cl','17','#eafaf1'],['Ar','18','#fef9e7'],['K','19','#fdebd0'],['Ca','20','#fdebd0'],
      ].map(([sym,num,bg]) => `
        <div class="pt-cell" style="background:${bg}; border:1px solid rgba(0,0,0,0.07); padding:14px 10px; text-align:center; cursor:default; transition:transform 0.15s, box-shadow 0.15s;"
             onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'"
             onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:8px; color:rgba(0,0,0,0.3); margin-bottom:4px;">${num}</div>
          <div style="font-size:22px; font-weight:700; letter-spacing:-0.02em; color:#000; line-height:1;">${sym}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 6: STATS / NUMBERS ───
makeSection('#000', `
  <style>
    @media (max-width: 600px) {
      .stats-wrap { padding: 80px 24px !important; }
      .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
    }
  </style>
  <div class="stats-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:16px;">By The Numbers</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#fff;">
      Scale of our research
    </h2>
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:48px;">
      ${[
        ['2.4B','Molecules screened annually'],
        ['38ms','Avg. inference time per compound'],
        ['97.2%','Binding affinity prediction accuracy'],
        ['14','Published Nature papers in 2024'],
      ].map(([val,label]) => `
        <div>
          <div style="font-size:clamp(28px,4vw,48px); font-weight:700; letter-spacing:-0.03em; color:#fff; line-height:1; margin-bottom:12px;">${val}</div>
          <div style="font-size:11px; color:rgba(255,255,255,0.35); line-height:1.6;">${label}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 7: TECHNOLOGY STACK ───
makeSection('#f5f5f4', `
  <style>
    @media (max-width: 700px) {
      .tech-wrap { padding: 80px 24px !important; }
      .tech-cols { flex-direction: column !important; gap: 40px !important; }
    }
  </style>
  <div class="tech-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">Technology</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#000;">
      How we compute<br>at molecular scale
    </h2>
    <div class="tech-cols" style="display:flex; gap:80px;">
      <div style="flex:1;">
        ${[
          ['Density Functional Theory','Our quantum chemistry engine solves the Kohn-Sham equations for systems with up to 10,000 atoms using adaptive mesh refinement.'],
          ['Graph Neural Networks','We represent molecules as attributed graphs, learning invariant representations under rotation, translation, and reflection.'],
          ['Active Learning','Bayesian optimization guides synthesis campaigns, selecting the most informative experiments to run next.'],
        ].map(([t,d],i) => `
          <div style="${i>0?'border-top:1px solid rgba(0,0,0,0.08);':''}padding:28px 0;">
            <div style="font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#000; margin-bottom:10px;">${t}</div>
            <div style="font-size:12px; line-height:1.8; color:rgba(0,0,0,0.5);">${d}</div>
          </div>
        `).join('')}
      </div>
      <div style="flex:1;">
        ${[
          ['Diffusion Models','Generative models trained on 1.2B conformations produce novel 3D molecular geometries that satisfy target property constraints.'],
          ['Distributed Compute','Our cluster spans 4,096 H100 GPUs across three data centers, purpose-built for molecular dynamics workloads.'],
          ['Open-Source Tooling','Core components of our stack are open-sourced under Apache 2.0, including our molecular graph library and featurization pipeline.'],
        ].map(([t,d],i) => `
          <div style="${i>0?'border-top:1px solid rgba(0,0,0,0.08);':''}padding:28px 0;">
            <div style="font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#000; margin-bottom:10px;">${t}</div>
            <div style="font-size:12px; line-height:1.8; color:rgba(0,0,0,0.5);">${d}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
`);

// ─── SECTION 8: TIMELINE ───
makeSection('#f5f5f4', `
  <style>
    @media (max-width: 600px) {
      .tl-wrap { padding: 80px 24px !important; }
      .tl-row { flex-direction: column !important; gap: 8px !important; }
      .tl-year { min-width: 0 !important; width: 100% !important; }
    }
  </style>
  <div class="tl-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">History</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 64px; color:#000;">
      Milestones in<br>chemical discovery
    </h2>
    <div style="display:flex; flex-direction:column; gap:0;">
      ${[
        ['1661','Robert Boyle publishes The Sceptical Chymist, separating chemistry from alchemy and defining the concept of an element.'],
        ['1789','Antoine Lavoisier names oxygen and hydrogen, establishes the law of conservation of mass, and publishes the first modern chemistry textbook.'],
        ['1808','John Dalton proposes atomic theory — that all matter is composed of indivisible atoms with fixed relative weights.'],
        ['1869','Dmitri Mendeleev arranges 63 known elements into the first periodic table, predicting properties of undiscovered elements.'],
        ['1897','J.J. Thomson discovers the electron via cathode ray experiments, revealing the first subatomic particle.'],
        ['1911','Ernest Rutherford\'s gold foil experiment reveals the atomic nucleus, overturning Thomson\'s plum-pudding model.'],
        ['1926','Erwin Schrödinger formulates wave mechanics; the Schrödinger equation becomes the foundation of quantum chemistry.'],
        ['1953','Watson and Crick determine the double-helix structure of DNA using X-ray crystallography data from Rosalind Franklin.'],
        ['1985','Buckminsterfullerene (C₆₀) is discovered by Curl, Kroto, and Smalley, opening the field of carbon nanomaterials.'],
        ['2003','The Human Genome Project completes sequencing 3 billion base pairs, transforming drug discovery and molecular biology.'],
        ['2020','AlphaFold 2 predicts protein 3D structures with atomic accuracy, solving a 50-year grand challenge in structural biology.'],
        ['2024','AI-driven de novo molecular design accelerates drug candidates from concept to preclinical trials in under 18 months.'],
      ].map(([year, text], i) => `
        <div class="tl-row" style="display:flex; gap:48px; align-items:flex-start; padding:28px 0; ${i > 0 ? 'border-top:1px solid rgba(0,0,0,0.07);' : ''} transition:opacity 0.2s;"
             onmouseenter="this.style.opacity='0.65'" onmouseleave="this.style.opacity='1'">
          <div class="tl-year" style="min-width:64px; font-size:13px; font-weight:700; letter-spacing:-0.01em; color:#000; padding-top:2px;">${year}</div>
          <div style="flex:1; font-size:13px; line-height:1.8; color:rgba(0,0,0,0.55);">${text}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 9: PARTNERSHIPS ───
makeSection('#fff', `
  <style>
    @media (max-width: 600px) {
      .partners-wrap { padding: 80px 24px !important; }
      .partners-grid { grid-template-columns: 1fr 1fr !important; }
    }
  </style>
  <div class="partners-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:16px;">Collaborations</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 16px; color:#000;">
      Built with the world's<br>leading institutions
    </h2>
    <p style="font-size:14px; line-height:1.8; color:rgba(0,0,0,0.45); max-width:500px; margin:0 0 64px;">
      Our research partnerships span top universities, national laboratories, and pharmaceutical companies across four continents.
    </p>
    <div class="partners-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:rgba(0,0,0,0.08);">
      ${[
        ['MIT','Massachusetts Institute of Technology','Quantum chemistry & ML'],
        ['Stanford','Stanford University','Drug discovery pipeline'],
        ['CERN','European Organization for Nuclear Research','Particle & material data'],
        ['Pfizer','Pfizer Research Labs','Therapeutic molecule design'],
        ['Max Planck','Max Planck Institute','Theoretical chemistry'],
        ['NIST','Natl. Institute of Standards & Tech.','Reference datasets & validation'],
      ].map(([abbr, full, focus]) => `
        <div style="background:#fff; padding:32px 24px; transition:background 0.2s;"
             onmouseenter="this.style.background='#f5f5f4'"
             onmouseleave="this.style.background='#fff'">
          <div style="font-size:20px; font-weight:700; letter-spacing:-0.02em; color:#000; margin-bottom:6px;">${abbr}</div>
          <div style="font-size:10px; color:rgba(0,0,0,0.4); margin-bottom:14px; line-height:1.5;">${full}</div>
          <div style="font-size:9px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(0,0,0,0.3); padding:5px 10px; background:rgba(0,0,0,0.04); display:inline-block;">${focus}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 10: OPEN SOURCE ───
makeSection('#000', `
  <style>
    @media (max-width: 600px) {
      .os-wrap { padding: 80px 24px !important; }
      .os-grid { grid-template-columns: 1fr !important; }
    }
  </style>
  <div class="os-wrap" style="max-width:960px; margin:0 auto; padding:120px 48px;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:16px;">Open Source</div>
    <h2 style="font-size:clamp(28px,4vw,52px); font-weight:700; letter-spacing:-0.03em; line-height:1.1; margin:0 0 16px; color:#fff;">
      Science belongs<br>to everyone
    </h2>
    <p style="font-size:14px; line-height:1.8; color:rgba(255,255,255,0.4); max-width:480px; margin:0 0 64px;">
      We open-source our core infrastructure so the global research community can build on our work and push discovery further.
    </p>
    <div class="os-grid" style="display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:rgba(255,255,255,0.08);">
      ${[
        ['valence/molkit','Molecular graph featurization & fingerprinting library','12.4k ★','Python'],
        ['valence/conformer','3D conformation generation from 2D SMILES','8.1k ★','Python / C++'],
        ['valence/sdfnet','SDF-based neural implicit surface renderer for molecules','5.7k ★','Python / GLSL'],
        ['valence/retrosyn','Transformer model for retrosynthetic pathway planning','9.3k ★','Python'],
      ].map(([repo, desc, stars, lang]) => `
        <div style="background:#111; padding:32px 28px; transition:background 0.2s; cursor:pointer;"
             onmouseenter="this.style.background='#1a1a1a'"
             onmouseleave="this.style.background='#111'">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:12px;">
            <div style="font-size:12px; font-weight:600; color:#fff; font-family:monospace; letter-spacing:0.02em;">${repo}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.3); white-space:nowrap;">${stars}</div>
          </div>
          <div style="font-size:12px; line-height:1.7; color:rgba(255,255,255,0.4); margin-bottom:16px;">${desc}</div>
          <div style="font-size:9px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.1); display:inline-block; padding:3px 8px;">${lang}</div>
        </div>
      `).join('')}
    </div>
  </div>
`);

// ─── SECTION 11: JOIN / CTA ───
makeSection('#fff', `
  <style>
    @media (max-width: 600px) {
      .join-wrap { padding: 100px 24px !important; }
    }
  </style>
  <div class="join-wrap" style="max-width:960px; margin:0 auto; padding:140px 48px; text-align:center;">
    <div style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,0,0,0.3); margin-bottom:24px;">Join Us</div>
    <h2 style="font-size:clamp(32px,5vw,68px); font-weight:700; letter-spacing:-0.03em; line-height:1.05; margin:0 0 24px; color:#000;">
      The future of chemistry<br>is computational
    </h2>
    <p style="font-size:14px; line-height:1.8; color:rgba(0,0,0,0.45); max-width:440px; margin:0 auto 48px;">
      We're looking for chemists, physicists, and engineers who want to push the boundary of what's molecularly possible.
    </p>

  </div>
`);

// Material params (fixed values, no UI panel)
const materialParams = {
  roughness: 0.0,
  blend: 1.2,
  specular: 0,
  subsurface: 1.0,
  ambient: 0.25,
  colorSharpness: 3.0,
  reflectionStrength: 1.5,
  bgColor: '#d4d4d8',
};



window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// Mouse coords relative to viewport (fixed canvas)

// Mouse interaction - convert screen coords to world-space ray hit on z=0 plane
const mouseWorld = new THREE.Vector3(0, 0, -10);
const smoothMouse = new THREE.Vector3(0, 0, -10);

window.addEventListener('mousemove', (e) => {
  const aspect = window.innerWidth / window.innerHeight;
  const x = ((e.clientX / window.innerWidth) * 2.0 - 1.0) * aspect;
  const y = -((e.clientY / window.innerHeight) * 2.0 - 1.0);
  // Project into scene space (matching the ray setup: ro.z = -5, rd.z = 1.5)
  // At z=0 plane: t = (0 - (-5)) / 1.5 = 3.33, so scale uv by 3.33
  const scale = 5.0 / 1.5;
  mouseWorld.set(x * scale, y * scale, 0.0);
});

window.addEventListener('mouseleave', () => {
  mouseWorld.set(0, 0, -10); // move far away when mouse leaves
});

// Smooth the mouse in the animation loop
const origAnimate = animate;
const clock2 = new THREE.Clock();
function animateWithMouse() {
  requestAnimationFrame(animateWithMouse);
  const dt = Math.min(clock2.getDelta(), 0.05);
  const lerpFactor = 1.0 - Math.exp(-6.0 * dt);
  smoothMouse.lerp(mouseWorld, lerpFactor);
  material.uniforms.uMouse.value.copy(smoothMouse);
  material.uniforms.uTime.value = clock.getElapsedTime();
  material.uniforms.uRoughness.value = materialParams.roughness;
  material.uniforms.uBlend.value = materialParams.blend;
  material.uniforms.uSpecular.value = materialParams.specular;
  material.uniforms.uSubsurface.value = materialParams.subsurface;
  material.uniforms.uAmbient.value = materialParams.ambient;
  material.uniforms.uColorSharpness.value = materialParams.colorSharpness;
  material.uniforms.uReflectionStrength.value = materialParams.reflectionStrength;
  material.uniforms.uBgColor.value.set(materialParams.bgColor);
  renderer.render(scene, camera);
}

// Replace the original animation loop
animateWithMouse();