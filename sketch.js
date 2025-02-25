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

// 粒子类
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.prevPos = this.pos.copy();
    this.vel = createVector(0, 0);
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
  }

  // 更新粒子位置
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.prevPos = this.pos.copy();
    this.pos.add(this.vel);
    this.acc.mult(0);
    
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

  // 跟随流场
  follow(flowfield) {
    let x = floor(this.pos.x / FLOW_FIELD_RESOLUTION);
    let y = floor(this.pos.y / FLOW_FIELD_RESOLUTION);
    let index = x + y * cols;
    
    // 确保索引在有效范围内
    if (index >= 0 && index < flowfield.length) {
      let force = flowfield[index];
      this.applyForce(force);
    }
  }

  // 显示粒子
  show() {
    stroke(this.hue, this.saturation, this.brightness, this.alpha);
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
      let angle = noise(xOffset, yOffset, noiseTime) * TWO_PI * 2;
      let v = p5.Vector.fromAngle(angle);
      v.setMag(1);
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
  for (let particle of particles) {
    particle.follow(flowField);
    particle.avoidMouse(mousePos, MOUSE_INFLUENCE_RADIUS, MOUSE_INFLUENCE_STRENGTH);
    particle.update();
    particle.show();
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
