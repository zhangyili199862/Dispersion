varying vec3 vWorldNormal;
varying vec3 vEyeVector;

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
    vec3 transformedNormal = normalMatrix * normal;
    vWorldNormal = normalize(transformedNormal);

    vEyeVector = normalize(worldPos.xyz - cameraPosition);
}
