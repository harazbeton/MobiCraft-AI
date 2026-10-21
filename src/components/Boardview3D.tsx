import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TestPoint3D } from '../types/repair';
import { GALAXY_A53_TESTPOINTS } from '../data/sampleData';
import {
  Layers,
  Zap,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Eye,
  Maximize2,
  Activity,
  Sliders,
} from 'lucide-react';

interface Boardview3DProps {
  testPoints?: TestPoint3D[];
  activeStage?: number;
  onSelectStage?: (stage: number) => void;
  deviceModel?: string;
  lang?: 'fa' | 'en';
}

export const Boardview3D: React.FC<Boardview3DProps> = ({
  testPoints = GALAXY_A53_TESTPOINTS,
  activeStage: propActiveStage,
  onSelectStage,
  deviceModel = 'Samsung Galaxy A53 5G',
  lang = 'fa',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(propActiveStage || 1);
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);

  // Sync internal stage with props
  useEffect(() => {
    if (propActiveStage && propActiveStage !== currentStage) {
      setCurrentStage(propActiveStage);
    }
  }, [propActiveStage]);

  const activeTp = testPoints.find((tp) => tp.stage === currentStage) || testPoints[0];

  // Ref to Three.js internal objects for runtime updates
  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    subBoardGroup: THREE.Group;
    flexGroup: THREE.Group;
    mainBoardGroup: THREE.Group;
    redProbe: THREE.Group;
    targetProbePos: THREE.Vector3;
    currentProbePos: THREE.Vector3;
    tpMarkers: THREE.Mesh[];
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 640;
    const height = mountRef.current.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, -5.5, 6.5);
    camera.lookAt(0, 0, 0);

    // 2. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    mountRef.current.replaceChildren(renderer.domElement);

    // 3. Lighting Rig (Key, Fill, Rim)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(4, 6, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    // 4. Grounding Contact Shadow Plane
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.z = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- PROCEDURAL 3D HARDWARE MODEL ---

    // A. Sub-Board (برد شارژ پایینی)
    const subBoardGroup = new THREE.Group();
    const subPcbGeo = new THREE.BoxGeometry(2.4, 1.6, 0.08);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Dark solder mask green
      roughness: 0.35,
      metalness: 0.2,
    });
    const subPcb = new THREE.Mesh(subPcbGeo, pcbMat);
    subPcb.castShadow = true;
    subPcb.receiveShadow = true;
    subBoardGroup.add(subPcb);

    // Type-C Port Shell on Sub-board
    const typeCGeo = new THREE.BoxGeometry(0.8, 0.5, 0.22);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.2,
    });
    const typeC = new THREE.Mesh(typeCGeo, metalMat);
    typeC.position.set(-0.8, -0.7, 0.12);
    typeC.castShadow = true;
    subBoardGroup.add(typeC);

    // Sub-board FPC Header
    const subFpcGeo = new THREE.BoxGeometry(0.6, 0.35, 0.12);
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
    const subFpc = new THREE.Mesh(subFpcGeo, headerMat);
    subFpc.position.set(0.6, 0.4, 0.08);
    subBoardGroup.add(subFpc);

    subBoardGroup.position.set(-1.2, -2.0, 0);
    scene.add(subBoardGroup);

    // B. Interconnect Flex Cable (فلت رابط شارژ به مین‌برد)
    const flexGroup = new THREE.Group();
    const flexGeo = new THREE.BoxGeometry(0.5, 2.4, 0.03);
    const flexMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber polyimide flex ribbon
      roughness: 0.4,
      metalness: 0.1,
    });
    const flexCable = new THREE.Mesh(flexGeo, flexMat);
    flexCable.position.set(0, 0, 0.03);
    flexGroup.add(flexCable);

    // Printed VBUS copper trace on flex
    const traceGeo = new THREE.BoxGeometry(0.08, 2.3, 0.04);
    const traceMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const trace = new THREE.Mesh(traceGeo, traceMat);
    trace.position.set(-0.1, 0, 0.04);
    flexGroup.add(trace);

    flexGroup.position.set(-0.6, 0, 0);
    scene.add(flexGroup);

    // C. Main Logic Board (مادربرد اصلی)
    const mainBoardGroup = new THREE.Group();
    const mainPcbGeo = new THREE.BoxGeometry(3.2, 2.8, 0.1);
    const mainPcb = new THREE.Mesh(mainPcbGeo, pcbMat);
    mainPcb.castShadow = true;
    mainPcb.receiveShadow = true;
    mainBoardGroup.add(mainPcb);

    // Main FPC Header
    const mainFpc = new THREE.Mesh(subFpcGeo, headerMat);
    mainFpc.position.set(-1.0, -1.0, 0.09);
    mainBoardGroup.add(mainFpc);

    // Shield Canister (شیلد فلزی محافظ پردازنده و رم)
    const shieldGeo = new THREE.BoxGeometry(1.6, 1.4, 0.2);
    const shield = new THREE.Mesh(shieldGeo, metalMat);
    shield.position.set(0.4, 0.4, 0.12);
    shield.castShadow = true;
    mainBoardGroup.add(shield);

    // OVP / Charging PMIC Chip
    const pmicGeo = new THREE.BoxGeometry(0.45, 0.45, 0.14);
    const icMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const pmic = new THREE.Mesh(pmicGeo, icMat);
    pmic.position.set(0.6, -0.6, 0.1);
    mainBoardGroup.add(pmic);

    // Battery connector pins
    const battConnGeo = new THREE.BoxGeometry(0.7, 0.3, 0.15);
    const battConn = new THREE.Mesh(battConnGeo, headerMat);
    battConn.position.set(1.1, 1.0, 0.1);
    mainBoardGroup.add(battConn);

    mainBoardGroup.position.set(0.6, 1.6, 0);
    scene.add(mainBoardGroup);

    // 5. Test Point Markers (Glowing Gold Pads with Rings)
    const tpMarkers: THREE.Mesh[] = [];
    testPoints.forEach((tp) => {
      const padGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
      const padMat = new THREE.MeshStandardMaterial({
        color: tp.readingStatus === 'fault' ? 0xef4444 : 0xfbbf24,
        emissive: tp.readingStatus === 'fault' ? 0x7f1d1d : 0x78350f,
        roughness: 0.2,
        metalness: 0.9,
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(...tp.position3D);
      scene.add(pad);
      tpMarkers.push(pad);
    });

    // 6. Multimeter Red Probe 3D Model
    const redProbe = new THREE.Group();
    // Needle tip
    const needleGeo = new THREE.ConeGeometry(0.03, 0.35, 12);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.rotation.x = Math.PI;
    needle.position.z = 0.17;
    redProbe.add(needle);

    // Probe Handle
    const handleGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.2, 16);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const handle = new THREE.Mesh(handleGeo, redMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.z = 0.85;
    redProbe.add(handle);

    // Initial probe position
    const initPos = new THREE.Vector3(...activeTp.position3D);
    redProbe.position.copy(initPos).add(new THREE.Vector3(0, 0, 0.05));
    scene.add(redProbe);

    // Animation & Smooth Damping Variables
    const currentProbePos = redProbe.position.clone();
    const targetProbePos = initPos.clone();

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      subBoardGroup,
      flexGroup,
      mainBoardGroup,
      redProbe,
      targetProbePos,
      currentProbePos,
      tpMarkers,
    };

    // 7. Mouse Drag to Orbit (Lightweight native implementation without external bundle)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = 0;
    let sphericalPhi = 0.5;
    let radius = 8.5;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= deltaX * 0.01;
      sphericalPhi = Math.max(0.2, Math.min(Math.PI / 2 - 0.1, sphericalPhi - deltaY * 0.01));

      camera.position.x = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = -radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.position.z = radius * Math.cos(sphericalPhi);
      camera.lookAt(0, 0, 0);
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(4.0, Math.min(14.0, radius + e.deltaY * 0.008));
      camera.position.x = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = -radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.position.z = radius * Math.cos(sphericalPhi);
      camera.lookAt(0, 0, 0);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Render Animation Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth probe glide to target test point
      currentProbePos.lerp(targetProbePos, 0.08);
      redProbe.position.set(currentProbePos.x, currentProbePos.y, currentProbePos.z + 0.08);

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  // Update Probe Target when active stage changes
  useEffect(() => {
    if (!sceneRefs.current || !activeTp) return;
    const target = new THREE.Vector3(...activeTp.position3D);
    sceneRefs.current.targetProbePos.copy(target);
  }, [currentStage, activeTp]);

  // Update Exploded View
  useEffect(() => {
    if (!sceneRefs.current) return;
    const { subBoardGroup, flexGroup, mainBoardGroup } = sceneRefs.current;
    if (explodedView) {
      subBoardGroup.position.set(-1.2, -3.2, -0.6);
      flexGroup.position.set(-0.6, 0, 0.4);
      mainBoardGroup.position.set(0.6, 2.5, 0.8);
    } else {
      subBoardGroup.position.set(-1.2, -2.0, 0);
      flexGroup.position.set(-0.6, 0, 0);
      mainBoardGroup.position.set(0.6, 1.6, 0);
    }
  }, [explodedView]);

  const handleNextStage = () => {
    if (currentStage < testPoints.length) {
      const next = currentStage + 1;
      setCurrentStage(next);
      onSelectStage?.(next);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      const prev = currentStage - 1;
      setCurrentStage(prev);
      onSelectStage?.(prev);
    }
  };

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      {/* 3D Header HUD Banner */}
      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-xl pointer-events-auto shadow-md">
          <div className="text-[11px] text-slate-400 font-mono">
            3D Boardview & Interactive Probing Lab
          </div>
          <div className="text-xs font-bold text-amber-400">{deviceModel}</div>
        </div>

        {/* 3D Viewport Action Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-1 rounded-xl pointer-events-auto">
          <button
            type="button"
            onClick={() => setExplodedView(!explodedView)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 ${
              explodedView
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
            title="تفکیک لایه‌های ساب‌برد، فلت و مادربرد"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تفکیک قطعات (Exploded)</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Viewport */}
      <div
        ref={mountRef}
        className="w-full h-80 sm:h-96 relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* Multimeter Probing HUD Dock */}
      <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 space-y-3">
        {/* Stage Progress Bar (1 to 5) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {testPoints.map((tp) => {
            const isActive = tp.stage === currentStage;
            const isCompleted = tp.stage < currentStage;
            const isFault = tp.readingStatus === 'fault';

            return (
              <button
                key={tp.id}
                type="button"
                onClick={() => {
                  setCurrentStage(tp.stage);
                  onSelectStage?.(tp.stage);
                }}
                className={`flex-1 min-w-[70px] text-center py-1.5 px-2 rounded-lg border text-[11px] transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-400 bg-amber-500/15 text-white font-bold shadow-sm'
                    : isCompleted
                    ? 'border-slate-800 bg-slate-950/40 text-slate-400'
                    : 'border-slate-800/60 bg-slate-950/20 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>گام {tp.stage}</span>
                  {isFault ? (
                    <AlertOctagon className="w-3 h-3 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                <div className="text-[10px] font-mono truncate">{tp.name.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Digital Multimeter Readout Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5">
          {/* LCD Segmented Display Simulation */}
          <div className="md:col-span-4 bg-black/90 border border-slate-800 rounded-lg p-3 font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>DIGITAL MULTIMETER</span>
              <span className="text-amber-400">DC VOLTAGE</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-bold tracking-wider tabular-nums ${
                  activeTp.readingStatus === 'fault'
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {activeTp.measuredVoltage}
              </span>
              <span className="text-xs text-slate-400 font-sans">
                نرمال: {activeTp.expectedVoltage}
              </span>
            </div>
          </div>

          {/* Diagnostic Finding & Probing Instruction */}
          <div className="md:col-span-8 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-400">{activeTp.name}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  activeTp.readingStatus === 'fault'
                    ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                }`}
              >
                {activeTp.readingStatus === 'fault' ? 'خطا / قطع مسیر' : 'ولتاژ نرمال'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {activeTp.instruction}
            </p>
            <div className="text-[11px] font-mono text-cyan-400 pt-0.5">
              نقشه و شماتیک: {activeTp.schematicNote}
            </div>
          </div>
        </div>

        {/* Navigation Step Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            disabled={currentStage === 1}
            onClick={handlePrevStage}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>گام قبلی</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentStage} از {testPoints.length}
          </span>

          <button
            type="button"
            disabled={currentStage === testPoints.length}
            onClick={handleNextStage}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
          >
            <span>گام بعدی ولتاژگیری</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
