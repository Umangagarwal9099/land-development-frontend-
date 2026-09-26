#!/usr/bin/env bash
# Optimise an artist's GLB for the showroom: meshopt geometry, KTX2 textures, and a low-res LOD.
#   ./scripts/optimize-model.sh input.glb out/villa-a
# Produces out/villa-a.glb (full) and out/villa-a.low.glb (shown first while the full model streams).
set -euo pipefail

in="$1"
out="$2"
mkdir -p "$(dirname "$out")"

npx -y @gltf-transform/cli optimize "$in" "$out.glb" \
  --compress meshopt --texture-compress ktx2 --texture-size 2048

npx -y @gltf-transform/cli optimize "$in" "$out.low.glb" \
  --compress meshopt --texture-compress ktx2 --texture-size 512 \
  --simplify true --simplify-ratio 0.25

ls -lh "$out.glb" "$out.low.glb"
