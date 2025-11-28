class PoolTableScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.gl = this.canvas.getContext('webgl2');
        this.program = null;
        this.emissiveProgram = null;
        this.animationId = null;
        
        // 场景状态
        this.currentScene = 1;
        this.isAnimating = false;
        this.animationTime = 0;
        
        // 相机系统
        this.camera = {
            type: 'top', // 'top', 'follow'
            position: [0, 8, 0],
            target: [0, 0, 0],
            up: [0, 0, 1]
        };
        
        // 物体集合
        this.objects = {
            table: null,
            cue: null,
            whiteBall: null,
            blackBall: null,
            pockets: [],
            ambientLights: []
        };
        
        // 动画状态
        this.animationState = {
            cuePulling: false,
            cueHitting: false,
            whiteBallMoving: false,
            blackBallMoving: false,
            blackBallInPocket: false
        };
        
        this.init();
    }

    init() {
        if (!this.gl) {
            alert('WebGL 2.0 is not available in your browser!');
            return;
        }

        this.setupShaders();
        this.setupBuffers();
        this.createScene();
        this.setupEventListeners();
        this.render();
    }

    setupShaders() {
        const gl = this.gl;
        
        // 主着色器程序
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, shaders.vertexShader);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, shaders.fragmentShader);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program link error:', gl.getProgramInfoLog(this.program));
        }

        // 发光着色器程序
        const emissiveVS = this.compileShader(gl.VERTEX_SHADER, shaders.emissiveVertexShader);
        const emissiveFS = this.compileShader(gl.FRAGMENT_SHADER, shaders.emissiveFragmentShader);
        
        this.emissiveProgram = gl.createProgram();
        gl.attachShader(this.emissiveProgram, emissiveVS);
        gl.attachShader(this.emissiveProgram, emissiveFS);
        gl.linkProgram(this.emissiveProgram);

        gl.useProgram(this.program);
        
        // 获取attribute和uniform位置
        this.attribLocations = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            normal: gl.getAttribLocation(this.program, 'aNormal')
        };
        
        this.uniformLocations = {
            modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            normalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
            lightPosition: gl.getUniformLocation(this.program, 'uLightPosition'),
            lightColor: gl.getUniformLocation(this.program, 'uLightColor'),
            ambientColor: gl.getUniformLocation(this.program, 'uAmbientColor'),
            diffuseColor: gl.getUniformLocation(this.program, 'uDiffuseColor'),
            specularColor: gl.getUniformLocation(this.program, 'uSpecularColor'),
            shininess: gl.getUniformLocation(this.program, 'uShininess'),
            fogColor: gl.getUniformLocation(this.program, 'uFogColor'),
            fogDensity: gl.getUniformLocation(this.program, 'uFogDensity')
        };

        this.emissiveUniforms = {
            modelViewMatrix: gl.getUniformLocation(this.emissiveProgram, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.emissiveProgram, 'uProjectionMatrix'),
            emissiveColor: gl.getUniformLocation(this.emissiveProgram, 'uEmissiveColor'),
            intensity: gl.getUniformLocation(this.emissiveProgram, 'uIntensity')
        };
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    setupBuffers() {
        this.buffers = {
            cube: this.createCubeBuffer(),
            sphere: this.createSphereBuffer(16, 16),
            cylinder: this.createCylinderBuffer(16),
            plane: this.createPlaneBuffer()
        };
    }

    createCubeBuffer() {
        const gl = this.gl;
        
        const vertices = new Float32Array([
            // 位置坐标 + 法线坐标
            -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  // 前面
             0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
             0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
            -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
            
            // 后面、上面、下面、右面、左面...
            // 为简洁起见，这里省略详细顶点数据
            // 实际实现中需要完整的立方体顶点数据
        ]);

        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3,    // 前面
            // 其他面的索引...
        ]);

        return this.createBuffer(vertices, indices);
    }

    createSphereBuffer(latBands, longBands) {
        const gl = this.gl;
        const vertices = [];
        const indices = [];
        
        // 生成球体顶点
        for (let lat = 0; lat <= latBands; lat++) {
            const theta = lat * Math.PI / latBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= longBands; lon++) {
                const phi = lon * 2 * Math.PI / longBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                vertices.push(x * 0.5, y * 0.5, z * 0.5, x, y, z);
            }
        }
        
        // 生成索引
        for (let lat = 0; lat < latBands; lat++) {
            for (let lon = 0; lon < longBands; lon++) {
                const first = (lat * (longBands + 1)) + lon;
                const second = first + longBands + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        
        return this.createBuffer(new Float32Array(vertices), new Uint16Array(indices));
    }

    createCylinderBuffer(segments) {
        const gl = this.gl;
        const vertices = [];
        const indices = [];
        
        // 简化的圆柱体实现
        // 实际实现需要生成顶部、底部和侧面的顶点
        
        return this.createBuffer(new Float32Array(vertices), new Uint16Array(indices));
    }

    createPlaneBuffer() {
        const gl = this.gl;
        
        const vertices = new Float32Array([
            -1, 0, -1,  0, 1, 0,  // 位置 + 法线
             1, 0, -1,  0, 1, 0,
             1, 0,  1,  0, 1, 0,
            -1, 0,  1,  0, 1, 0
        ]);

        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        return this.createBuffer(vertices, indices);
    }

    createBuffer(vertices, indices) {
        const gl = this.gl;
        
        const buffer = {
            vao: gl.createVertexArray(),
            vertexBuffer: gl.createBuffer(),
            indexBuffer: gl.createBuffer(),
            vertexCount: indices.length
        };
        
        gl.bindVertexArray(buffer.vao);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(this.attribLocations.position);
        gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 24, 0);
        
        gl.enableVertexAttribArray(this.attribLocations.normal);
        gl.vertexAttribPointer(this.attribLocations.normal, 3, gl.FLOAT, false, 24, 12);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        gl.bindVertexArray(null);
        
        return buffer;
    }

    createScene() {
        // 创建台球桌
        this.objects.table = {
            type: 'cube',
            position: [0, 0, 0],
            scale: [4, 2, 0.1],
            color: [0.1, 0.5, 0.1]
        };
        
        // 创建球杆
        this.objects.cue = {
            type: 'cylinder',
            position: [-1.5, 0, 0.2],
            scale: [0.05, 0.05, 1.5],
            color: [0.8, 0.6, 0.3],
            rotation: [0, 0, 0]
        };
        
        // 创建白球
        this.objects.whiteBall = {
            type: 'sphere',
            position: [0, 0, 0.3],
            scale: [0.15, 0.15, 0.15],
            color: [1, 1, 1],
            originalPosition: [0, 0, 0.3]
        };
        
        // 创建黑球
        this.objects.blackBall = {
            type: 'sphere',
            position: [1.5, 0, 0.3],
            scale: [0.15, 0.15, 0.15],
            color: [0.1, 0.1, 0.1],
            originalPosition: [1.5, 0, 0.3]
        };
        
        // 创建球袋
        for (let i = 0; i < 6; i++) {
            this.objects.pockets.push({
                type: 'cylinder',
                position: [0, 0, 0],
                scale: [0.2, 0.2, 0.1],
                color: [0.2, 0.2, 0.2]
            });
        }
        
        // 创建氛围灯
        for (let i = 0; i < 4; i++) {
            this.objects.ambientLights.push({
                type: 'cube',
                position: [0, 0, 0],
                scale: [0.1, 0.1, 0.1],
                color: [0, 0.5, 1],
                intensity: 0
            });
        }
    }

    setupEventListeners() {
        // 场景切换按钮
        document.getElementById('scene1').addEventListener('click', () => {
            this.switchToScene(1);
        });
        
        document.getElementById('scene2').addEventListener('click', () => {
            this.switchToScene(2);
        });
        
        document.getElementById('scene3').addEventListener('click', () => {
            this.switchToScene(3);
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.resetScene();
        });
    }

    switchToScene(sceneNumber) {
        this.currentScene = sceneNumber;
        this.animationTime = 0;
        this.isAnimating = true;
        
        // 重置动画状态
        this.resetAnimationState();
        
        // 更新UI
        document.getElementById('current-scene').textContent = 
            `场景${sceneNumber} - ${this.getSceneDescription(sceneNumber)}`;
        
        // 设置相机
        this.setupCameraForScene(sceneNumber);
    }

    getSceneDescription(scene) {
        switch(scene) {
            case 1: return '瞄准击球';
            case 2: return '球体碰撞';
            case 3: return '黑球入袋';
            default: return '未知场景';
        }
    }

    setupCameraForScene(scene) {
        switch(scene) {
            case 1:
                // 俯视视角
                this.camera.type = 'top';
                this.camera.position = [0, 8, 0];
                this.camera.target = [0, 0, 0];
                break;
            case 2:
                // 跟随视角
                this.camera.type = 'follow';
                this.camera.position = [2, 3, 2];
                this.camera.target = this.objects.whiteBall.position;
                break;
            case 3:
                // 俯视视角
                this.camera.type = 'top';
                this.camera.position = [0, 8, 0];
                this.camera.target = [0, 0, 0];
                break;
        }
    }

    resetAnimationState() {
        this.animationState = {
            cuePulling: false,
            cueHitting: false,
            whiteBallMoving: false,
            blackBallMoving: false,
            blackBallInPocket: false
        };
        
        // 重置物体位置
        this.objects.whiteBall.position = [...this.objects.whiteBall.originalPosition];
        this.objects.blackBall.position = [...this.objects.blackBall.originalPosition];
        this.objects.cue.position = [-1.5, 0, 0.2];
        
        // 关闭氛围灯
        this.objects.ambientLights.forEach(light => {
            light.intensity = 0;
        });
    }

    resetScene() {
        this.currentScene = 1;
        this.animationTime = 0;
        this.isAnimating = false;
        this.resetAnimationState();
        this.setupCameraForScene(1);
        
        document.getElementById('current-scene').textContent = '场景1 - 瞄准击球';
    }

    updateAnimations(deltaTime) {
        if (!this.isAnimating) return;
        
        this.animationTime += deltaTime;
        
        switch(this.currentScene) {
            case 1:
                this.updateScene1(deltaTime);
                break;
            case 2:
                this.updateScene2(deltaTime);
                break;
            case 3:
                this.updateScene3(deltaTime);
                break;
        }
    }

    updateScene1(deltaTime) {
        const cue = this.objects.cue;
        
        // 球杆拉回
        if (this.animationTime < 1.0) {
            cue.position[0] = -1.5 - this.animationTime * 0.3;
            this.animationState.cuePulling = true;
        }
        // 球杆击出
        else if (this.animationTime < 1.2) {
            cue.position[0] = -1.8 + (this.animationTime - 1.0) * 3.0;
            this.animationState.cueHitting = true;
        }
        // 切换到场景2
        else if (this.animationTime > 1.5) {
            this.switchToScene(2);
        }
    }

    updateScene2(deltaTime) {
        const whiteBall = this.objects.whiteBall;
        const blackBall = this.objects.blackBall;
        
        // 白球移动
        if (this.animationTime < 1.0) {
            whiteBall.position[0] += deltaTime * 2.0;
            this.animationState.whiteBallMoving = true;
            
            // 更新跟随相机的目标
            if (this.camera.type === 'follow') {
                this.camera.target = whiteBall.position;
            }
        }
        // 黑球移动
        else if (this.animationTime < 2.0) {
            blackBall.position[0] += deltaTime * 1.5;
            this.animationState.blackBallMoving = true;
        }
        // 切换到场景3
        else if (this.animationTime > 2.2) {
            this.switchToScene(3);
        }
    }

    updateScene3(deltaTime) {
        const blackBall = this.objects.blackBall;
        
        // 黑球入袋动画
        if (this.animationTime < 0.5) {
            // 缩放模拟入袋
            const scale = 1.0 - this.animationTime * 2.0;
            blackBall.scale = [scale * 0.15, scale * 0.15, scale * 0.15];
            this.animationState.blackBallInPocket = true;
            
            // 点亮氛围灯
            this.objects.ambientLights.forEach((light, index) => {
                light.intensity = Math.min(1.0, this.animationTime * 3.0);
            });
        }
    }

    render() {
        const gl = this.gl;
        const currentTime = performance.now();
        const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000;
        this.lastTime = currentTime;
        
        this.updateAnimations(deltaTime);
        
        // 清除画布
        gl.clearColor(0.1, 0.1, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        
        // 设置投影矩阵
        const projectionMatrix = Matrix4.create();
        Matrix4.perspective(projectionMatrix, 
            Math.PI/4, 
            this.canvas.width/this.canvas.height, 
            0.1, 100
        );
        
        // 设置视图矩阵
        const viewMatrix = Matrix4.create();
        Matrix4.lookAt(viewMatrix, 
            this.camera.position, 
            this.camera.target, 
            this.camera.up
        );
        
        // 使用主着色器
        gl.useProgram(this.program);
        
        // 设置光照
        gl.uniform3f(this.uniformLocations.lightPosition, 0, 5, 5);
        gl.uniform3f(this.uniformLocations.lightColor, 1.0, 1.0, 1.0);
        gl.uniform3f(this.uniformLocations.fogColor, 0.1, 0.1, 0.2);
        gl.uniform1f(this.uniformLocations.fogDensity, 0.02);
        
        // 渲染所有物体
        this.renderObject(this.objects.table, viewMatrix, projectionMatrix);
        this.renderObject(this.objects.cue, viewMatrix, projectionMatrix);
        this.renderObject(this.objects.whiteBall, viewMatrix, projectionMatrix);
        this.renderObject(this.objects.blackBall, viewMatrix, projectionMatrix);
        
        // 渲染球袋
        this.objects.pockets.forEach(pocket => {
            this.renderObject(pocket, viewMatrix, projectionMatrix);
        });
        
        // 使用发光着色器渲染氛围灯
        gl.useProgram(this.emissiveProgram);
        this.objects.ambientLights.forEach(light => {
            this.renderEmissiveObject(light, viewMatrix, projectionMatrix);
        });
        
        this.animationId = requestAnimationFrame(() => this.render());
    }

    renderObject(obj, viewMatrix, projectionMatrix) {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        const modelMatrix = Matrix4.create();
        
        // 应用变换
        Matrix4.translate(modelMatrix, modelMatrix, obj.position);
        
        if (obj.rotation) {
            Matrix4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
            Matrix4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
            Matrix4.rotateY(modelMatrix, modelMatrix, obj.rotation[2]);
        }
        
        Matrix4.multiply(modelMatrix, modelMatrix, this.createScaleMatrix(obj.scale));
        
        this.setMatrixUniforms(modelMatrix, viewMatrix, projectionMatrix);
        this.setMaterial(obj.color, obj.color, [0.3, 0.3, 0.3], 32);
        
        // 选择对应的缓冲区
        let buffer;
        switch(obj.type) {
            case 'cube':
                buffer = this.buffers.cube;
                break;
            case 'sphere':
                buffer = this.buffers.sphere;
                break;
            case 'cylinder':
                buffer = this.buffers.cylinder;
                break;
            case 'plane':
                buffer = this.buffers.plane;
                break;
        }
        
        if (buffer) {
            gl.bindVertexArray(buffer.vao);
            gl.drawElements(gl.TRIANGLES, buffer.vertexCount, gl.UNSIGNED_SHORT, 0);
        }
    }

    renderEmissiveObject(obj, viewMatrix, projectionMatrix) {
        const gl = this.gl;
        gl.useProgram(this.emissiveProgram);
        
        const modelMatrix = Matrix4.create();
        Matrix4.translate(modelMatrix, modelMatrix, obj.position);
        Matrix4.multiply(modelMatrix, modelMatrix, this.createScaleMatrix(obj.scale));
        
        gl.uniformMatrix4fv(this.emissiveUniforms.modelViewMatrix, false, 
            Matrix4.multiply(Matrix4.create(), viewMatrix, modelMatrix));
        gl.uniformMatrix4fv(this.emissiveUniforms.projectionMatrix, false, projectionMatrix);
        gl.uniform3f(this.emissiveUniforms.emissiveColor, ...obj.color);
        gl.uniform1f(this.emissiveUniforms.intensity, obj.intensity);
        
        const buffer = this.buffers.cube;
        gl.bindVertexArray(buffer.vao);
        gl.drawElements(gl.TRIANGLES, buffer.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    createScaleMatrix(scale) {
        const matrix = Matrix4.create();
        matrix[0] = scale[0];
        matrix[5] = scale[1];
        matrix[10] = scale[2];
        return matrix;
    }

    setMatrixUniforms(modelMatrix, viewMatrix, projectionMatrix) {
        const gl = this.gl;
        
        const modelViewMatrix = Matrix4.create();
        Matrix4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        
        const normalMatrix = Matrix4.create();
        // 简化法线矩阵计算
        Matrix4.multiply(normalMatrix, modelViewMatrix, modelViewMatrix);
        
        gl.uniformMatrix4fv(this.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.normalMatrix, false, normalMatrix);
    }

    setMaterial(diffuse, ambient, specular, shininess) {
        const gl = this.gl;
        
        gl.uniform3f(this.uniformLocations.ambientColor, ...ambient);
        gl.uniform3f(this.uniformLocations.diffuseColor, ...diffuse);
        gl.uniform3f(this.uniformLocations.specularColor, ...specular);
        gl.uniform1f(this.uniformLocations.shininess, shininess);
    }
}

// 启动场景
window.addEventListener('load', () => {
    new PoolTableScene();
});
