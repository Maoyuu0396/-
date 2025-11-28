const shaders = {
    // 基础Phong着色器
    vertexShader: `#version 300 es
        in vec4 aPosition;
        in vec3 aNormal;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uNormalMatrix;
        
        out vec3 vNormal;
        out vec3 vPosition;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
            vNormal = mat3(uNormalMatrix) * aNormal;
            vPosition = vec3(uModelViewMatrix * aPosition);
        }
    `,

    fragmentShader: `#version 300 es
        precision highp float;
        
        in vec3 vNormal;
        in vec3 vPosition;
        
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform vec3 uAmbientColor;
        uniform vec3 uDiffuseColor;
        uniform vec3 uSpecularColor;
        uniform float uShininess;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        
        out vec4 fragColor;
        
        void main() {
            // 环境光
            vec3 ambient = uAmbientColor;
            
            // 漫反射
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(uLightPosition - vPosition);
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = diff * uDiffuseColor * uLightColor;
            
            // 镜面反射
            vec3 viewDir = normalize(-vPosition);
            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
            vec3 specular = spec * uSpecularColor * uLightColor;
            
            // 雾效
            float fogDistance = length(vPosition);
            float fogFactor = exp(-uFogDensity * fogDistance * fogDistance);
            fogFactor = clamp(fogFactor, 0.0, 1.0);
            
            vec3 result = ambient + diffuse + specular;
            result = mix(uFogColor, result, fogFactor);
            
            fragColor = vec4(result, 1.0);
        }
    `,

    // 简单发光着色器（用于氛围灯）
    emissiveVertexShader: `#version 300 es
        in vec4 aPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        }
    `,

    emissiveFragmentShader: `#version 300 es
        precision highp float;
        uniform vec3 uEmissiveColor;
        uniform float uIntensity;
        
        out vec4 fragColor;
        
        void main() {
            fragColor = vec4(uEmissiveColor * uIntensity, 1.0);
        }
    `
};
