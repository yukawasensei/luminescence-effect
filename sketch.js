// 粒子数组
let particles = [];
// 粒子数量
const PARTICLE_COUNT = 2000;
// 流场分辨率
const FLOW_FIELD_RESOLUTION = 20;
// 流场
let flowField = [];
// 流场列数
let cols;
// 流场行数
let rows;
// 噪声缩放
const NOISE_SCALE = 0.1;
// 噪声时间增量
const NOISE_TIME_INCREMENT = 0.003;
// 噪声空间增量
const NOISE_SPACE_INCREMENT = 0.1;
// 当前噪声时间
let noiseTime = 0;
// 鼠标影响半径
const MOUSE_INFLUENCE_RADIUS = 120;
// 鼠标影响强度
const MOUSE_INFLUENCE_STRENGTH = 8;
// 扩散强度
const DIFFUSION_STRENGTH = 0.05;
// 粒子寿命范围
const PARTICLE_LIFE_MIN = 100;
const PARTICLE_LIFE_MAX = 300;
// 边缘生成概率
const EDGE_SPAWN_PROBABILITY = 0.7;

// 粒子类
class Particle {
  constructor() {
    // 随机决定是从边缘生成还是随机位置生成
    if (random() < EDGE_SPAWN_PROBABILITY) {
      // 从边缘生成
      let edge = floor(random(4)); // 0: 上, 1: 右, 2: 下, 3: 左
      switch (edge) {
        case 0: // 上边缘
          this.pos = createVector(random(width), 0);
          break;
        case 1: // 右边缘
          this.pos = createVector(width, random(height));
          break;
        case 2: // 下边缘
          this.pos = createVector(random(width), height);
          break;
        case 3: // 左边缘
          this.pos = createVector(0, random(height));
          break;
      }
    } else {
      // 随机位置生成
      this.pos = createVector(random(width), random(height));
    }
    
    this.prevPos = this.pos.copy();
    // 给粒子一个初始随机速度
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(0.5, 2));
    this.acc = createVector(0, 0);
    this.maxSpeed = random(1, 4);
    // 扩大色相范围，包括蓝色、紫色和粉色
    this.hue = random([
      random(180, 240), // 蓝色系
      random(240, 290), // 紫色系
      random(290, 330)  // 粉色系
    ]);
    this.saturation = random(70, 100);
    this.brightness = random(85, 100);
    this.alpha = random(10, 30);
    this.size = random(0.5, 2.5);
    // 添加粒子寿命
    this.life = random(PARTICLE_LIFE_MIN, PARTICLE_LIFE_MAX);
    this.maxLife = this.life;
  }

  // 更新粒子位置
  update() {
    // 添加一些随机扩散
    this.applyDiffusion();
    
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.prevPos = this.pos.copy();
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 减少寿命
    this.life--;
    
    // 边界处理
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.prevPos = this.pos.copy();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.prevPos = this.pos.copy();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.prevPos = this.pos.copy();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.prevPos = this.pos.copy();
    }
  }

  // 应用力
  applyForce(force) {
    this.acc.add(force);
  }
  
  // 应用扩散力
  applyDiffusion() {
    let diffusion = p5.Vector.random2D();
    diffusion.mult(DIFFUSION_STRENGTH);
    this.applyForce(diffusion);
  }

  // 跟随流场
  follow(flowfield) {
    let x = floor(this.pos.x / FLOW_FIELD_RESOLUTION);
    let y = floor(this.pos.y / FLOW_FIELD_RESOLUTION);
    let index = x + y * cols;
    
    // 确保索引在有效范围内
    if (index >= 0 && index < flowfield.length) {
      let force = flowfield[index];
      // 根据粒子位置添加一些变化
      let angle = noise(this.pos.x * 0.01, this.pos.y * 0.01, noiseTime) * PI;
      let variation = p5.Vector.fromAngle(angle);
      variation.mult(0.3); // 变化强度
      force.add(variation);
      this.applyForce(force);
    }
  }

  // 显示粒子
  show() {
    // 根据寿命调整透明度
    let alphaMultiplier = this.life / this.maxLife;
    stroke(this.hue, this.saturation, this.brightness, this.alpha * alphaMultiplier);
    strokeWeight(this.size);
    line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
  }

  // 避开鼠标
  avoidMouse(mousePos, radius, strength) {
    let distance = p5.Vector.dist(this.pos, mousePos);
    
    if (distance < radius) {
      let repelForce = p5.Vector.sub(this.pos, mousePos);
      repelForce.normalize();
      repelForce.mult(strength * (1 - distance / radius));
      this.applyForce(repelForce);
    }
  }
  
  // 检查粒子是否死亡
  isDead() {
    return this.life <= 0;
  }
  
  // 重置粒子
  reset() {
    // 随机决定是从边缘生成还是随机位置生成
    if (random() < EDGE_SPAWN_PROBABILITY) {
      // 从边缘生成
      let edge = floor(random(4)); // 0: 上, 1: 右, 2: 下, 3: 左
      switch (edge) {
        case 0: // 上边缘
          this.pos = createVector(random(width), 0);
          break;
        case 1: // 右边缘
          this.pos = createVector(width, random(height));
          break;
        case 2: // 下边缘
          this.pos = createVector(random(width), height);
          break;
        case 3: // 左边缘
          this.pos = createVector(0, random(height));
          break;
      }
    } else {
      // 随机位置生成
      this.pos = createVector(random(width), random(height));
    }
    
    this.prevPos = this.pos.copy();
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(0.5, 2));
    this.acc = createVector(0, 0);
    this.life = random(PARTICLE_LIFE_MIN, PARTICLE_LIFE_MAX);
    this.maxLife = this.life;
    // 随机更新颜色
    this.hue = random([
      random(180, 240), // 蓝色系
      random(240, 290), // 紫色系
      random(290, 330)  // 粉色系
    ]);
  }
}

// 设置
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  background(210, 5, 98); // 更浅的蓝色背景
  
  // 初始化流场
  cols = floor(width / FLOW_FIELD_RESOLUTION);
  rows = floor(height / FLOW_FIELD_RESOLUTION);
  
  // 创建流场
  updateFlowField();
  
  // 创建粒子
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

// 更新流场
function updateFlowField() {
  flowField = new Array(cols * rows);
  
  let yOffset = 0;
  for (let y = 0; y < rows; y++) {
    let xOffset = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      // 使用多层噪声创建更复杂的流场
      let angle = noise(xOffset, yOffset, noiseTime) * TWO_PI * 2;
      // 添加第二层噪声
      angle += noise(xOffset * 2, yOffset * 2, noiseTime * 1.5) * PI;
      let v = p5.Vector.fromAngle(angle);
      // 根据位置变化力的大小
      let magnitude = map(noise(xOffset * 0.5, yOffset * 0.5, noiseTime * 0.5), 0, 1, 0.5, 1.5);
      v.setMag(magnitude);
      flowField[index] = v;
      xOffset += NOISE_SPACE_INCREMENT;
    }
    yOffset += NOISE_SPACE_INCREMENT;
  }
  
  noiseTime += NOISE_TIME_INCREMENT;
}

// 绘制
function draw() {
  // 半透明背景，创建拖尾效果
  fill(210, 5, 98, 3);
  rect(0, 0, width, height);
  
  // 每隔一段时间更新流场
  if (frameCount % 10 === 0) {
    updateFlowField();
  }
  
  // 创建鼠标位置向量
  let mousePos = createVector(mouseX, mouseY);
  
  // 更新并显示所有粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let particle = particles[i];
    particle.follow(flowField);
    particle.avoidMouse(mousePos, MOUSE_INFLUENCE_RADIUS, MOUSE_INFLUENCE_STRENGTH);
    particle.update();
    particle.show();
    
    // 检查粒子是否死亡，如果是则重置
    if (particle.isDead()) {
      particle.reset();
    }
  }
}

// 窗口大小调整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // 重新初始化流场
  cols = floor(width / FLOW_FIELD_RESOLUTION);
  rows = floor(height / FLOW_FIELD_RESOLUTION);
  updateFlowField();
}
