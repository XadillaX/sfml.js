'use strict';

// Port of SFML/examples/tennis/Tennis.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

/** Run the original single-player tennis game. */
async function main() {
  const gameWidth = 800;
  const gameHeight = 600;
  const paddleSize = new sf.Vector2f(25, 100);
  const ballRadius = 10;
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(gameWidth, gameHeight), 32),
    'SFML Tennis',
    { style: sf.Style.Titlebar + sf.Style.Close }
  );
  window.setVerticalSyncEnabled(true);

  const ballSoundBuffer = new sf.SoundBuffer();
  if (
    !(await ballSoundBuffer.loadFromFile(
      path.join(__dirname, 'resources/ball.wav')
    ))
  ) {
    throw new Error('ball.wav');
  }

  const ballSound = new sf.Sound(ballSoundBuffer);
  const sfmlLogoTexture = new sf.Texture();
  if (
    !(await sfmlLogoTexture.loadFromFile(
      path.join(__dirname, 'resources/sfml_logo.png')
    ))
  ) {
    throw new Error('logo');
  }

  const sfmlLogo = new sf.Sprite(sfmlLogoTexture);
  sfmlLogo.setPosition(new sf.Vector2f(170, 50));

  const leftPaddle = new sf.RectangleShape(new sf.Vector2f(22, 97));
  const rightPaddle = new sf.RectangleShape(
    new sf.Vector2f(22, 97)
  );
  for (const paddle of [ leftPaddle, rightPaddle ]) {
    paddle.setOutlineThickness(3);
    paddle.setOutlineColor(sf.Color.Black);
    paddle.setOrigin(
      new sf.Vector2f(paddleSize.x / 2, paddleSize.y / 2)
    );
  }

  leftPaddle.setFillColor(new sf.Color(100, 100, 200));

  rightPaddle.setFillColor(new sf.Color(200, 100, 100));

  const ball = new sf.CircleShape({ radius: ballRadius - 3 });
  ball.setOutlineThickness(2);
  ball.setOutlineColor(sf.Color.Black);
  ball.setFillColor(sf.Color.White);
  ball.setOrigin(new sf.Vector2f(ballRadius / 2, ballRadius / 2));

  const font = new sf.Font();
  if (
    !(await font.openFromFile(
      path.join(__dirname, 'resources/tuffy.ttf')
    ))
  ) {
    throw new Error('font');
  }

  const pauseMessage = new sf.Text({
    font,
    characterSize: 40,
    string:
      'Welcome to SFML Tennis!\n\nPress space to start the game.',
  });
  pauseMessage.setPosition(new sf.Vector2f(170, 200));
  pauseMessage.setFillColor(sf.Color.White);

  const aiTimer = new sf.Clock();
  const paddleSpeed = 400;
  let rightPaddleSpeed = 0;
  const ballSpeed = 400;
  let ballAngle = 0;
  const clock = new sf.Clock();
  let isPlaying = false;

  /** Reset the paddles, ball and original randomized serve angle. */
  function start() {
    isPlaying = true;
    clock.restart();

    leftPaddle.setPosition(new sf.Vector2f(22.5, gameHeight / 2));

    rightPaddle.setPosition(
      new sf.Vector2f(gameWidth - 22.5, gameHeight / 2)
    );

    ball.setPosition(
      new sf.Vector2f(gameWidth / 2, gameHeight / 2)
    );
    do {
      ballAngle = Math.random() * Math.PI * 2;
    } while (Math.abs(Math.cos(ballAngle)) < 0.7);
  }

  /** Process input, advance physics and draw one frame. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      const key = event.getIf('KeyPressed');
      if (
        event.is('Closed') ||
        key?.code === sf.Keyboard.Key.Escape
      ) {
        window.close();

        return;
      }

      if (
        (key?.code === sf.Keyboard.Key.Space ||
          event.is('TouchBegan')) &&
        !isPlaying
      ) {
        start();
      }

      if (event.is('Resized')) {
        const view = new sf.View();
        view.setSize(new sf.Vector2f(gameWidth, gameHeight));
        view.setCenter(
          new sf.Vector2f(gameWidth / 2, gameHeight / 2)
        );

        window.setView(view);
      }
    }

    if (isPlaying) {
      const deltaTime = clock.restart().asSeconds();
      if (
        sf.Keyboard.isKeyPressed(sf.Keyboard.Key.Up) &&
        leftPaddle.getPosition().y - paddleSize.y / 2 > 5
      ) {
        leftPaddle.move(
          new sf.Vector2f(0, -paddleSpeed * deltaTime)
        );
      }

      if (
        sf.Keyboard.isKeyPressed(sf.Keyboard.Key.Down) &&
        leftPaddle.getPosition().y + paddleSize.y / 2 <
          gameHeight - 5
      ) {
        leftPaddle.move(
          new sf.Vector2f(0, paddleSpeed * deltaTime)
        );
      }

      if (
        (rightPaddleSpeed < 0 &&
          rightPaddle.getPosition().y - paddleSize.y / 2 > 5) ||
        (rightPaddleSpeed > 0 &&
          rightPaddle.getPosition().y + paddleSize.y / 2 <
            gameHeight - 5)
      ) {
        rightPaddle.move(
          new sf.Vector2f(0, rightPaddleSpeed * deltaTime)
        );
      }

      if (aiTimer.getElapsedTime().asSeconds() > 0.1) {
        aiTimer.restart();
        if (
          ball.getPosition().y + ballRadius >
          rightPaddle.getPosition().y + paddleSize.y / 2
        ) {
          rightPaddleSpeed = paddleSpeed;
        } else if (
          ball.getPosition().y - ballRadius <
          rightPaddle.getPosition().y - paddleSize.y / 2
        ) {
          rightPaddleSpeed = -paddleSpeed;
        } else {
          rightPaddleSpeed = 0;
        }
      }

      ball.move(
        new sf.Vector2f(
          ballSpeed * deltaTime * Math.cos(ballAngle),
          ballSpeed * deltaTime * Math.sin(ballAngle)
        )
      );

      const position = ball.getPosition();
      if (
        position.x - ballRadius < 0 ||
        position.x + ballRadius > gameWidth
      ) {
        isPlaying = false;
        pauseMessage.setString(
          (position.x < gameWidth / 2 ? 'You Lost!' : 'You Won!') +
            '\n\nPress space to restart or\nescape to exit.'
        );
      }

      if (
        position.y - ballRadius < 0 ||
        position.y + ballRadius > gameHeight
      ) {
        ballSound.play();
        ballAngle = -ballAngle;
        ball.setPosition(
          new sf.Vector2f(
            position.x,
            position.y < gameHeight / 2
              ? ballRadius + 0.1
              : gameHeight - ballRadius - 0.1
          )
        );
      }

      for (const [ paddle, left ] of [
        [ leftPaddle, true ],
        [ rightPaddle, false ],
      ]) {
        const p = paddle.getPosition();
        const b = ball.getPosition();
        const edge = b.x + (left ? -ballRadius : ballRadius);
        if (
          (left
            ? edge < p.x + paddleSize.x / 2 && edge > p.x
            : edge > p.x - paddleSize.x / 2 && edge < p.x) &&
          b.y + ballRadius >= p.y - paddleSize.y / 2 &&
          b.y - ballRadius <= p.y + paddleSize.y / 2
        ) {
          ballAngle =
            Math.PI -
            ballAngle +
            ((b.y > p.y ? 1 : -1) * Math.random() * 20 * Math.PI) /
              180;
          ballSound.play();

          ball.setPosition(
            new sf.Vector2f(
              p.x +
                (left ? 1 : -1) *
                  (ballRadius + paddleSize.x / 2 + 0.1),
              b.y
            )
          );
        }
      }
    }

    window.clear(new sf.Color(50, 50, 50));
    if (isPlaying) {
      window.draw(leftPaddle);
      window.draw(rightPaddle);
      window.draw(ball);
    } else {
      window.draw(pauseMessage);
      window.draw(sfmlLogo);
    }

    window.display();
    if (window.isOpen()) {
      setImmediate(frame);
    }
  }

  frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
