import { useMemo } from 'react';
import { JOINT_NAMES, RIG } from './poses';
import type { JointName, Pose } from './types';

// Procedural articulated humanoid built from primitives. It is posed entirely by
// joint rotations from a Pose, so the same data that the pure math produces drives
// the render. A rigged glTF (e.g. Mixamo) can replace this later behind the same
// `pose` prop. Web-only: imported solely by PoseViewer.web.tsx.

const LIMB_COLOR = '#8FB7FF';
const HEAD_COLOR = '#EAF0FF';

function childrenOf(): Record<JointName, JointName[]> {
  const map = {} as Record<JointName, JointName[]>;
  for (const j of JOINT_NAMES) map[j] = [];
  for (const j of JOINT_NAMES) {
    const parent = RIG[j].parent;
    if (parent) map[parent].push(j);
  }
  return map;
}

function JointNode({
  joint,
  pose,
  children,
}: {
  joint: JointName;
  pose: Pose;
  children: Record<JointName, JointName[]>;
}) {
  const bone = RIG[joint];
  const rotation = pose[joint] ?? [0, 0, 0];
  const isRoot = bone.parent === null;

  return (
    <group position={bone.offset} rotation={rotation}>
      {isRoot ? (
        // Pelvis block rather than a downward cylinder.
        <mesh>
          <boxGeometry args={[0.34, 0.16, 0.18]} />
          <meshStandardMaterial color={LIMB_COLOR} />
        </mesh>
      ) : (
        <mesh position={[0, -bone.length / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, bone.length, 12]} />
          <meshStandardMaterial color={LIMB_COLOR} />
        </mesh>
      )}

      {joint === 'neck' && (
        <mesh position={[0, bone.length * 0.7, 0]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color={HEAD_COLOR} />
        </mesh>
      )}

      {children[joint].map((k) => (
        <JointNode key={k} joint={k} pose={pose} children={children} />
      ))}
    </group>
  );
}

export function Figure({ pose }: { pose: Pose }) {
  const children = useMemo(childrenOf, []);
  return <JointNode joint="hips" pose={pose} children={children} />;
}
