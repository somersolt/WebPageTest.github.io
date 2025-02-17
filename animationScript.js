// Matter.js 모듈 불러오기
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// 엔진 및 월드 생성
const engine = Engine.create();
const { world } = engine;
engine.world.gravity.y = 9.8;

// 캔버스 크기 설정
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;

// 렌더링 설정
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: canvasWidth,
        height: canvasHeight,
        wireframes: false,
        background: "#222" // 어두운 배경
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// 삼각형 크기 및 위치
const triangleSize = 600;
const thickness = 60;
const triangleHeight = (Math.sqrt(3) / 2) * triangleSize;
const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

// 삼각형 꼭짓점 좌표 계산
const pointA = { x: centerX, y: centerY - triangleHeight / 2 };
const pointB = { x: centerX - triangleSize / 2, y: centerY + triangleHeight / 2 };
const pointC = { x: centerX + triangleSize / 2, y: centerY + triangleHeight / 2 };

// 삼각형 변 생성
const wallA = Bodies.rectangle(
    (pointA.x + pointB.x) / 2, (pointA.y + pointB.y) / 2,
    Math.sqrt((pointB.x - pointA.x) ** 2 + (pointB.y - pointA.y) ** 2), thickness,
    { isStatic: true, 
        restitution: 0.8,
        friction: 0.2,
        angle: Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x), render: { fillStyle: '#fff' } }
);
const wallB = Bodies.rectangle(
    (pointB.x + pointC.x) / 2, (pointB.y + pointC.y) / 2,
    Math.sqrt((pointC.x - pointB.x) ** 2 + (pointC.y - pointB.y) ** 2), thickness,
    { isStatic: true,
        restitution: 0.8,
        friction: 0.2,
         angle: Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x), render: { fillStyle: '#fff' } }
);
const wallC = Bodies.rectangle(
    (pointC.x + pointA.x) / 2, (pointC.y + pointA.y) / 2,
    Math.sqrt((pointA.x - pointC.x) ** 2 + (pointA.y - pointC.y) ** 2), thickness,
    { isStatic: true,
        restitution: 0.8,
        friction: 0.2,
         angle: Math.atan2(pointA.y - pointC.y, pointA.x - pointC.x), render: { fillStyle: '#fff' } }
);

// 삼각형을 하나의 물체로 합치고 완전 고정
const triangleFrame = Body.create({
    parts: [wallA, wallB, wallC],
    isStatic: true,  // 삼각형을 고정해서 절대 밀리지 않게 함
});

Body.setPosition(triangleFrame, { x: centerX, y: centerY });
World.add(world, triangleFrame);


// 삼각형 내부에 공 생성
const balls = [];
const numBalls = 4;
for (let i = 0; i < numBalls; i++) {
    const radius = 20;
    let randomX, randomY;

    // 삼각형 내부의 무작위 좌표 생성 (반복해서 내부 좌표 찾기)
    do {
        randomX = centerX + (Math.random() - 0.5) * (triangleSize * 0.8);
        randomY = centerY + (Math.random() - 0.5) * (triangleHeight * 0.8);
    } while (!isPointInsideTriangle(randomX, randomY, pointA, pointB, pointC));

    // 공 생성 및 추가
    const ball = Bodies.circle(randomX, randomY, radius, {
        restitution: 0.9, // 튀는 정도
        friction: 0.1,
        frictionAir: 0.02,
        render: { fillStyle: `hsl(${Math.random() * 360}, 70%, 50%)` }
    });
    balls.push(ball);
    World.add(world, ball);
}

function isPointInsideTriangle(px, py, pA, pB, pC) {
    const areaOrig = Math.abs((pA.x * (pB.y - pC.y) + pB.x * (pC.y - pA.y) + pC.x * (pA.y - pB.y)) / 2);
    const area1 = Math.abs((px * (pB.y - pC.y) + pB.x * (pC.y - py) + pC.x * (py - pB.y)) / 2);
    const area2 = Math.abs((pA.x * (py - pC.y) + px * (pC.y - pA.y) + pC.x * (pA.y - py)) / 2);
    const area3 = Math.abs((pA.x * (pB.y - py) + pB.x * (py - pA.y) + px * (pA.y - pB.y)) / 2);

    // 부동소수점 오차를 고려한 근사치 비교
    const epsilon = 0.0001; // 매우 작은 값
    return Math.abs(areaOrig - (area1 + area2 + area3)) < epsilon;
}

function rotateTriangleAndCheckBalls() {
    // 삼각형 회전
    Body.setAngle(triangleFrame, triangleFrame.angle + 0.05);

    // 첫 번째 변의 중간점 계산 (wallA)
    const midA = {
        x: (wallA.vertices[0].x + wallA.vertices[3].x) / 2,
        y: (wallA.vertices[0].y + wallA.vertices[3].y) / 2
    };

    // 두 번째 변의 중간점 계산 (wallB)
    const midB = {
        x: (wallB.vertices[0].x + wallB.vertices[3].x) / 2,
        y: (wallB.vertices[0].y + wallB.vertices[3].y) / 2
    };

    // 세 번째 변의 중간점 계산 (wallC)
    const midC = {
        x: (wallC.vertices[0].x + wallC.vertices[3].x) / 2,
        y: (wallC.vertices[0].y + wallC.vertices[3].y) / 2
    };


    // 공 위치 확인 및 재배치
    balls.forEach(ball => {
        const ballPosition = ball.position;
        if (!isPointInsideTriangle(ballPosition.x, ballPosition.y, midA, midB, midC)) {
            // 공이 삼각형 영역을 벗어난 경우 중앙으로 재배치
            Body.setPosition(ball, { x: centerX, y: centerY });
            Body.setVelocity(ball, { x: 0, y: 0 }); // 속도 초기화
        }
    });
}

// 물리 엔진 업데이트 시 호출
Events.on(engine, 'beforeUpdate', () => {
    rotateTriangleAndCheckBalls(); // 삼각형 회전 및 공 위치 확인
    //drawTriangleFromPhysics(); // Matter.js와 동기화된 삼각형 그리기
});

// 삼각형 경계 시각화 함수 (디버깅용)
function drawTriangleFromPhysics() {
    const context = render.context;
    context.beginPath();
    
    // 첫 번째 변의 중간점 계산 (wallA)
    const midA = {
        x: (wallA.vertices[0].x + wallA.vertices[3].x) / 2,
        y: (wallA.vertices[0].y + wallA.vertices[3].y) / 2
    };

    // 두 번째 변의 중간점 계산 (wallB)
    const midB = {
        x: (wallB.vertices[0].x + wallB.vertices[3].x) / 2,
        y: (wallB.vertices[0].y + wallB.vertices[3].y) / 2
    };

    // 세 번째 변의 중간점 계산 (wallC)
    const midC = {
        x: (wallC.vertices[0].x + wallC.vertices[3].x) / 2,
        y: (wallC.vertices[0].y + wallC.vertices[3].y) / 2
    };
    
    context.moveTo(midA.x, midA.y);
    context.lineTo(midB.x, midB.y);
    context.lineTo(midC.x, midC.y);
    context.closePath();

    context.strokeStyle = '#ff0000'; // 빨간색 선
    context.lineWidth = 2;
    context.stroke();
}

// 창 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});