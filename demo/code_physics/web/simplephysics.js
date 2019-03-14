// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Simplified physics environment & API
 * built upon Matter.js (https://github.com/liabru/matter-js).
 *
 * SimplePhysics.run(codeString) will run a script.
 * SimplePhysics.stop() will stop the simulation, rendering,
 * and event handlers (including script timeouts and intervals).
 * SimplePhysics.reset() will call stop() and then clear the scene
 * of all objects, so it is ready for another execution.
 *
 * @author marshalla@google.com (Andrew n marshall)
 */
'use strict';

var SimplePhysics = (function() {
  const LOG_SCRIPT_SRC = false;
  const LOG_API_UNDEFINES = false;
  const DEFAULT_BODY_SIZE = 80;
  const RAD_TO_DEG = 180 / Math.PI;
  const DEG_TO_RAD = Math.PI / 180;

  /**
   * Scriptable API objects, variables, & functions, in the order received by
   * evalUserScript().
   */
  const SCRIPTABLE_API = [
    'Ball', 'Block', 'Circle', 'clearInterval', 'clearTimeout', 'console',
    'loadScene', 'Rectangle', 'setInterval', 'setTimeout', 'stop', 'World',
    'xy'
  ];

  /**
   * Crude, and INSECURE local variable declarations used to hide certain
   * JavaScript VM methods & state from the user's script.
   * Evaluated immediately before the user script, within the same scope.
   */
  const SYSTEM_API_UNDEFINES =
      Object.keys(window).
        filter((key) => SCRIPTABLE_API.indexOf(key) == -1).
        concat(['execScript', 'window', 'XMLHttpRequest', // system APIs
                'Matter', 'CodeMirror', 'SimplePhysics',
                '$', 'jQuery', '_', 'goog',
                'LOG_SCRIPT_SRC', 'SYSTEM_API_UNDEFINES', 'script',
                ]).
        map((key) => `var ${key} = undefined;\n`).
        join('');
  if (LOG_API_UNDEFINES) {
    console.log('SYSTEM_API_UNDEFINES:\n' + SYSTEM_API_UNDEFINES);
  }

  /**
   * This performs the user script evaluation, creating a unique scope with a precise
   * set of variables and functions. This function is defined outside most of
   * SimplePhysics to prevent it from leaking hoisted varaibles into scope.
   * Additionally, it will prefix SYSTEM_API_UNDEFINES to the evaluated string,
   * to hide system variables from the script.
   *
   * When adding any argument, also add it to and test it in the "Test API" sample.
   *
   * @return !Object<String,function> Map of user defined event handlers.
   */
  function evalUserScript(script,
        // User API values in alphabetical order.
        // TODO: How to verify spelling is always correct?
        Ball, Block, Circle, clearInterval, clearTimeout, console, loadScene,
        Rectangle, setInterval, setTimeout, stop, World, xy) {
    if (arguments.length != (SCRIPTABLE_API.length + 1)) {
      throw `Expected ${SCRIPTABLE_API.length + 1} arguments. Found ${arguments.length}.`;
    }

    if (LOG_SCRIPT_SRC) { console.log(`Evaluating script:\n${script}`); }
    let completeScript = script +
`;\n// Return callback functions defined within this scope.
let returnValue = {
  doBeforeUpdate: (typeof doBeforeUpdate === 'function' ? doBeforeUpdate : null),
  doAfterUpdate: (typeof doAfterUpdate === 'function' ? doAfterUpdate : null),
  doBeforeRender: (typeof doBeforeRender === 'function' ? doBeforeRender : null),
  doAfterRender: (typeof doAfterRender === 'function' ? doAfterRender : null)
};
returnValue;
`;

    var scriptCallbacks = eval(SYSTEM_API_UNDEFINES + completeScript);
    console.log('scriptCallbacks = ', scriptCallbacks);
    return scriptCallbacks;
  }

  // Private scope where the guts of SimplePhysics is defined.
  // This function returns the exported functions.
  return (function() {
    var _engine, _renderer, _rendering, _runner, _canvas;

    // Keep track of certain user data so we can reset the environment.
    const _userScript = {
      bodies: [],
      intervals: [],
      timeouts: []
    }

    /**
     * Sends e to callback function SimplePhysics.onerror, if present.
     * @param e {*}
     * @private
     */
    function emitError(e) {
      if (typeof SimplePhysics['onerror'] === 'function') {
        SimplePhysics.onerror(e.toString());
      }
    }

    /**
     * Signals success via callback function SimplePhysics.onsuccess, if present.
     * @private
     */
    function emitSuccess() {
      if (typeof SimplePhysics['onsuccess'] === 'function') {
        SimplePhysics.onsuccess();
      }
    }

    /**
     * Verifies value is a boolean.
     * @private
     * @param fieldName {string} The field name or other context where the value was assigned or
     *                           passed in. Used to give errors context.
     * @param value {*} The value to test the type.
     */
    function checkIsBoolean(fieldName, value) {
        var valueType = typeof value;
        if (valueType !== 'boolean') {
          throw `${fieldName} must be a boolean. Received ${valueType}.`
        }
    }

    /**
     * Verifies value is a number. Verifies it is within the given range if optMin and/or optMax are
     * defined.
     * @private
     * @param fieldName {string} The field name or other context where the value was assigned or
     *                           passed in. Used to give errors context.
     * @param value {*} The value to test the type and range.
     * @param optMin {number} An optional lower bound.
     * @param optMax {number} An optional upper bound.
     */
    function checkIsNumber(fieldName, value, optMin, optMax) {
      var num = Number(value);
      var hasMin = (typeof optMin === 'number')
      var belowMin = hasMin && num < optMin;
      var hasMax = (typeof optMax === 'number')
      var aboveMax = hasMax && num > optMax;
      if (isNaN(num) || belowMin || aboveMax) {
        var error = `${fieldName} must be a number`;
        if (hasMin || hasMax) {
          error += ` between ${optMin} and ${optMax}`;
        }
        error += `. Recieved ${typeof value} ${value}.`;
        throw error;
      }
    }

    /**
     * Verifies value is a vector-like object.
     * @private
     * @param fieldName {string} The field name or other context where the value was assigned or
     *                           passed in. Used to give errors context.
     * @param value {*} The value to test the type.
     */
    function checkIsVector(vec) {
      var xType = typeof vec.x;
      var yType = typeof vec.y;
      if (xType != 'number' || yType != 'number') {
        throw 'Expected vector with numeric properties x and y. ' +
              `Received ${typeof vec} ${JSON.stringify(xyObj)}`;
      }
    }

    // Simple API classes.
    /**
     * Namespace for static methods that manipulate the world.
     * Accessible by scripts.
     * @namespace
     */
    var World = {
      /**
       * Add an object to the physics simulation.
       * @param body {SimpleBody|Matter.Body} The body to add.
       */
      add: function(body) {
        Matter.World.add(_engine.world, body._matterBody || body);
      }
    };

    /**
     * Shorthand for constructing a Matter.Vector
     * Accessible by scripts.
     * @param x {number}
     * @param y {number}
     */
    function xy(x, y) {
      return {x, y};
    }

    /**
     * Base class for all physical bodies, which is a wrapper around a Matter.Body.
     * Accessible by scripts.
     */
    class SimpleBody {
      /**
       * @param matterBody {Matter.Body} The inner physical body implemented by Matter.js.
       */
      constructor(matterBody) {
        /**
         * The inner physical body implemented by Matter.js.
         * @type {Matter.Body}
         * @private
         */
        this._matterBody = matterBody;
        _userScript.bodies.push(matterBody);
      }

      /**
       * The rotation in degrees.
       * @type {number}
       */
      get angle() { return this._matterBody.angle * RAD_TO_DEG; }
      set angle(value) {
        checkIsNumber('angle', value);
        Matter.Body.setAngle(this._matterBody, valueNum * DEG_TO_RAD);
      }

      /**
       * The rotational speed (magnitude only) in degrees. Always non-negative.
       * @type {number}
       */
      get angularSpeed() { return this._matterBody.angularSpeed * DEG_TO_RAD; }

      /**
       * The rotational velocity (i.e., with sign) in degrees.
       * @type {number}
       */
      get angularVelocity() { return this._matterBody.angularVelocity * RAD_TO_DEG; }
      set angularVelocity(value) {
        checkIsNumber('angularVelocity', value);
        Matter.Body.setAngularVelocity(this._matterBody, value * DEG_TO_RAD)
      }

      /**
       * Area of the polygon that define's the body's convex hull.
       * @type {number}
       */
      get area() { return this._matterBody.area; }

      /**
       * The axis-aligned bounding box of the 2D shape.
       * @type {Matter.Bounds}
       */
      get bounds() { return this._matterBody.bounds; }

      /**
       * The color of shape, as a CSS color, gradient, or pattern.
       * @type {string}
       */
      get color() { return this._matterBody.render.fillStyle; }
      set color(value) { this._matterBody.render.fillStyle = value; }

      /**
       * The density (mass / area) of the shape's convex hull.
       * @type {number}
       */
      get density() { return this._matterBody.density; }
      set density(value) {
        checkIsNumber('density', value, 0);
        this._matterBody.setDensity(valueNum);  // Also update mass.
      }

      /**
       * A Number that defines the friction of the body.
       * See http://brm.io/matter-js/docs/classes/Body.html#property_friction
       * Defaults to 0.1
       * @type {number}
       */
      get friction() { return this._matterBody.friction; }
      set friction(value) {
        checkIsNumber('friction', value, 0, 1);
        this._matterBody.friction = value;
      }

      /**
       * A Number that defines the air friction of the body (air resistance).
       * See http://brm.io/matter-js/docs/classes/Body.html#property_frictionAir
       * Default: 0.01
       * @type {number}
       */
      get airFriction() { return this._matterBody.frictionAir; }
      set airFriction(value) {
        checkIsNumber('airFriction', value, 0);
        this._matterBody.frictionAir = value;
      }

      /**
       * A Number that defines the static friction of the body.
       * See http://brm.io/matter-js/docs/classes/Body.html#property_frictionStatic
       * Defaults to 0.5.
       * @type {number}
       */
      get staticFriction() { return this._matterBody.frictionStatic; }
      set staticFriction(value) {
        checkIsNumber('staticFriction', value, 0);
        this._matterBody.frictionStatic = value;
      }

      /**
       * A unique numeric identifier for this body.
       * @type {number}
       */
      get id() { return this._matterBody.id; }

      /**
       * The moment of inertia of the body.
       * See http://brm.io/matter-js/docs/classes/Body.html#property_inertia
       * @type {number}
       */
      get inertia() { return this._matterBody.inertia; }
      set inertia(value) {
        checkIsNumber('inertia', value, 0);
        Matter.Body.setInertia(value);
      }

      /**
       * A flag that indicates whether a body is a sensor. Sensor triggers
       * collision events, but doesn't react with colliding body physically.
       * @type {boolean}
       */
      get isSensor() { return this._matterBody.isSensor; }
      set isSensor(value) {
        checkIsBoolean('isSensor', value);
        this._matterBody.isSensor = value;
      }

      /**
       * A flag that indicates whether the body is considered sleeping.
       * See http://brm.io/matter-js/docs/classes/Body.html#property_isSleeping
       * @type {boolean}
       */
      get isSleeping() { return this._matterBody.isSleeping; }

      /**
       * Whether this body is static, fixed in position and rotation, and
       * immune to physical forces.
       * See http://brm.io/matter-js/docs/classes/Body.html#property_isStatic
       * @type {boolean}
       */
      get isStatic() { return this._matterBody.isStatic; }
      set isStatic(value) {
        checkIsBoolean('isStatic', value);
        this._matterBody.isStatic = value;
      }

      /**
       * A flag that indicates if the body should be rendered.
       * @type {boolean}
       */
      get isVisible() { return this._matterBody.render.visible; }
      set isVisible(value) {
        checkIsBoolean('isVisible', value);
        this._matterBody.render.visible = value;
      }

      /**
       * An arbitrary string to help identify and manage bodies.
       * @type {string}
       */
      get label() { return this._matterBody.label; }
      set label(value) { this._matterBody.label = value; }

      /**
       * The mass of the body. When updated, it will also update the density
       * based on the area.
       * @type {number}
       */
      get mass() { return this._matterBody.mass; }
      set mass(value) {
        checkIsNumber('mass', value, 0);
        this._matterBody.setMass(value);  // Also update density.
      }

      /**
       * The position of the body's center of mass. Updating the position
       * will not update velocity, angle, force etc. Contrast with with
       * applyForce().
       * @type {x: number, y: number}
       */
      get position() {
        var self = this;
        // Return an object that allows durectly assigning the subcomponents.
        return {
          get x() { return self._matterBody.position.x; },
          get y() { return self._matterBody.position.y; },
          set x(value) {
            Matter.Body.setPosition(self._matterBody, {x: value, y: this.y});
          },
          set y(value) {
            Matter.Body.setPosition(self._matterBody, {x: this.x, y: value});
          }
        };
      }
      set position(vec) {
        checkIsVector(vec);
        Matter.Body.setPosition(this._matterBody, vec);
      }

      /**
       * The linear velocity of the body. Updating the velocity will not update
       * the position, angle, force etc. Contrast with with applyForce().
       * @type {x: number, y: number}
       */
      get velocity() {
        // Return an object that allows directly reading/writing subcomponents.
        return {
          get x() { return self._matterBody.velocity.x; },
          get y() { return self._matterBody.velocity.y; },
          set x(value) {
            Matter.Body.setVelocity(self._matterBody, {x: value, y: this.y});
          },
          set y(value) {
            Matter.Body.setVelocity(self._matterBody, {x: this.x, y: value});
          }
        };
      }
      set velocity(vec) {
        checkIsVector(vec);
        Matter.Body.setVelocity(vec);
      }

      /**
       * Applies a force to the body's center of mass.
       * @param {x: number, y: number} forceVec
       */
      applyForce(forceVec) {
        checkIsVector(forceVec);
        Matter.Body.applyForce(this._matterBody, forceVec, this.position);
      }

      /**
       * Applies a force from a given world-space position, including
       * resulting torque.
       * @param {x: number, y: number} forceVec
       * @param {x: number, y: number} fromWorldPos
       */
      applyForceFrom(forceVec, fromWorldPos) {
        checkIsVector(forceVec);
        checkIsVector(fromWorldPos);
        Matter.Body.applyForce(this._matterBody, forceVec, fromWorldPos);
      }

      /**
       * Moves a body by a given vector relative to its current position,
       * without imparting any velocity.
       * @param deltaXY {x: number, y: number}
       */
      move(deltaXY) {
        checkIsVector(deltaXY);
        Matter.Body.translate(this._matterBody, deltaXY);
      }

      /**
       * Moves a body to the position, without imparting any velocity.
       * Same as assigning the position.
       * @param position {x: number, y: number}
       */
      moveTo(position) {
        this.position = position;
      }

      /**
       * Rotates this body by a given angle in degrees, relative to its current
       * angle, without imparting any angular velocity.
       * @param {number} degrees Angle to change, in degrees.
       */
      rotate(degrees) {
        checkIsNumber('1st argument of rotate(degrees)', degrees);
        Matter.Body.rotate(this._matterBody, degrees * DEG_TO_RAD);
      }
    }

    /**
     * A rectangular body, which is static (unmoving) by default. Useful as an obstacle.
     * Accessible by scripts.
     */
    class Rectangle extends SimpleBody {
      constructor(optWidth, optHeight) {
        var width =
            (typeof optWidth === 'number') ? optWidth : DEFAULT_BODY_SIZE;
        var height =
            (typeof optHeight === 'number') ? optHeight : DEFAULT_BODY_SIZE;
        super(Matter.Bodies.rectangle(
            0, -400,  // TODO: Let the Scene place the new obj.
            width, height));

        this.isStatic = true;
      }
    }

    /**
     * A movable Rectangle.
     * Accessible by scripts.
     */
    class Block extends Rectangle {
      constructor(optWidth, optHeight) {
        super(optWidth, optHeight);

        this.isStatic = false;
      }
    }

    /**
     * A circular body, which is static (unmoving) by default. Useful as an obstacle.
     * Accessible by scripts.
     */
    class Circle extends SimpleBody {
      constructor(optDiameter) {
        var radius = optDiameter / 2;
        if (isNaN(radius) || radius <= 0) {
          radius = DEFAULT_BODY_SIZE / 2;
        }
        super(Matter.Bodies.circle(
            0, -400,  // TODO: Let the Scene place the new obj.
            radius));

        this.isStatic = true;
      }

      get diameter() { this._matterBody.circleRadius * 2; }
      set diameter(value) {
        checkIsNumber('diameter', value);
        var scale = value / this.diameter;
        Matter.Body.scale(this._matterBody, scale, scale);
      }

      get radius() { this._matterBody.circleRadius; }
      set radius(value) {
        checkIsNumber('radius', value);
        var scale = value / this.radius;
        Matter.Body.scale(this._matterBody, scale, scale);
      }
    }

    /**
     * A movable Circle.
     * Accessible by scripts.
     */
    class Ball extends Circle {
      constructor(optRadius) {
        super(optRadius);

        this.isStatic = false;
      }
    }

    // filename or CSS background
    const BG_SKY_GRADIENT = 'linear-gradient(to bottom, #a0d8ef 0%,#ddf1f9 86%,#feffff 100%)';

    /**
     * Initializes the world in a named manner.  Currently only 'ground' is supported.
     * Accessible by scripts.
     * @param sceneName {string} The name of the scene.
     */
    function loadScene(sceneName) {
      var groundHeight = 20;
      var bounds = _renderer.bounds;
      var width = _canvas.width;
      var halfWidth = width / 2;
      bounds.min.x = -halfWidth;
      bounds.max.x = halfWidth;

      _renderer.options.wireframes = false;

      if ((/ground/i).test(sceneName) || (/log/i).test(sceneName)) {
        // TODO: Encapsulate as class in scene_ground.js
        _renderer.options.background = BG_SKY_GRADIENT;
        _engine.world.gravity.y = 1;

        var height = _canvas.height;
        bounds.min.y = groundHeight - height - 1;
        bounds.max.y = groundHeight - 1;
        _renderer.options.hasBounds = true;

        var ground = Matter.Bodies.rectangle(
            0, groundHeight / 2,  // Center X & Y
            width * 1.2, groundHeight, // Width & Height
            {isStatic: true});
        Matter.World.addBody(_engine.world, ground);

        if ((/log/i).test(sceneName)) {
          // Add log
          var logHeight = 160;
          var logWidth = width * 0.3;
          var logY = (groundHeight / 2) - (logHeight / 2);
          var logRight = Matter.Bodies.circle(
              logWidth + 1, logY, logHeight/2,
              {isStatic: true, render: {fillStyle: '#8B4513'}});
          var logBody = Matter.Bodies.rectangle(
              (logWidth + 1) / 2, logY, logWidth, logHeight,
              {isStatic: true, render: {fillStyle: '#8B4513'}});
          var logLeft = Matter.Bodies.circle(
              1, logY, logHeight/2,
              {isStatic: true, render: {fillStyle: '#8B4513'}});
          var logCore = Matter.Bodies.circle(
              1, logY, logHeight/2.4,
              {isStatic: true, render: {fillStyle: '#DEB887'}});
          Matter.World.addBody(_engine.world, logRight);
          Matter.World.addBody(_engine.world, logBody);
          Matter.World.addBody(_engine.world, logLeft);
          Matter.World.addBody(_engine.world, logCore);
        }
      } else if ((/sky/i).test(sceneName)) {
        _renderer.options.background = BG_SKY_GRADIENT;
        _engine.world.gravity.y = 1;

      } else if ((/space/i).test(sceneName)) {
        _renderer.options.background = 'black';

        // TODO: gravity... (and reset elsewhere)
        _engine.world.gravity.y = 0;

      } else if ((/ocean/i).test(sceneName) || (/beach/i).test(sceneName)) {
        _renderer.options.background = BG_SKY_GRADIENT;
        _engine.world.gravity.y = 1;

        var shoreAngle = 5 * DEG_TO_RAD;
        var seafloorWidth = (width / Math.cos(shoreAngle)) * 1.2;
        var seafloorHeight = seafloorWidth / 4;
        var seafloorY = seafloorHeight / 2 + 20;

        var seafloorLeft = Matter.Bodies.rectangle(
            -width, seafloorY,  // Center X & Y
            seafloorWidth, seafloorHeight, // Width & Height
            {
              isStatic: true,
              render: {fillStyle: '#e5dbaf'},
              angle: shoreAngle
            });
        var seafloorRight = Matter.Bodies.rectangle(
            0, seafloorY,  // Center X & Y
            seafloorWidth, seafloorHeight, // Width & Height
            {
              isStatic: true,
              render: {fillStyle: '#e5dbaf'},
              angle: -shoreAngle
            });

        Matter.World.addBody(_engine.world, seafloorLeft);
        Matter.World.addBody(_engine.world, seafloorRight);

        // TODO: Water particles.
        // for (let i = 0; i < 1; ++i) {
        //   let particle = Matter.Bodies.circle(
        //       -100, -20,  // Center X & Y
        //       20, 20, // Width & Height
        //       {
        //         render: {fillStyle: '#3399ff'},
        //       });
        //   Matter.World.addBody(_engine.world, particle);
        // }
      } else {
        let msg = `loadScene(): Unknown scene \"${sceneName}\".`;
        console.warn(msg);
        emitError(msg);
      }
    }

    /**
     * Wrapper of window.clearInterval() accessible by scripts as clearInterval().
     */
    function _clearInterval(intervalId) {
      window.clearInterval(intervalId);
      let index = _userScript.intervals.indexOf(intervalId);
      if (index > 0) {
        _userScript.intervals.splice(index, 1);
      } else {
        console.warn('_clearInterval: ' +
          `intervalId ${intervalId} not found in _userScript.intervals.`)
      }
    }

    /**
     * Wrapper of window.clearTimeout() accessible by scripts as clearTimeout().
     */
    function _clearTimeout(timeoutId) {
      window.clearTimeout(timeoutId);
      let index = _userScript.timeouts.indexOf(timeoutId);
      if (index > 0) {
        _userScript.timeouts.splice(index, 1);
      } else {
        console.warn('_clearTimeout: ' +
          `timeoutId ${timeoutId} not found in _userScript.timeouts.`)
      }
    }

    /**
     * Wrapper of window.setInterval() accessible by scripts as setInterval(). These interval
     * functions will not be called after SimplePhysics.stop().
     */
    function _setInterval(codeOrFn, delay, moreParams) {
      let intervalId = window.setInterval.apply(window, arguments);
      _userScript.intervals.push(intervalId);
      return intervalId;
    }

    /**
     * Wrapper of window.setTimeout() accessible by scripts as setTimeout(). These timeout functions
     * will not be called after SimplePhysics.stop().
     */
    function _setTimeout(codeOrFn, delay, moreParams) {
      let timeoutId = window.setTimeout.apply(window, arguments);
      _userScript.timeouts.push(timeoutId);
      return timeoutId;
    }

    /**
     * Reload the physics environment with a new script.
     */
    var run = function(userScript) {
      console.log('SimplePhysics run()');

      // Reset world
      reset(/* renderBlankFrame */ false);

      // Initialize Matter lib Engine & Render, if not already.
      if (!_runner) {
        _runner = Matter.Runner.create();
      }
      if (!_engine) {
        _engine = Matter.Engine.create();
      }
      Matter.Runner.run(_runner, _engine);
      if (!_renderer) {
        _canvas = document.getElementById('physics-canvas');
        _renderer = Matter.Render.create({
            canvas: _canvas,
            engine: _engine,
            options: {
              width: _canvas.width,
              height: _canvas.height
            }
        });
        _rendering = false;
      }
      if (!_rendering) {
        Matter.Render.run(_renderer);
        _rendering = true;
      }

      var scriptEventCallbacks;
      try {
        scriptEventCallbacks = evalUserScript(userScript,
            // The following are exposed to the user script, and must be
            // alphabetical to match the function argument variable names.
            Ball, Block, Circle, _clearInterval, _clearTimeout, console,
            loadScene, Rectangle, _setInterval, _setTimeout, stop, World, xy);
        emitSuccess();
      } catch(e) {
        console.error(`ERROR: While evaluating script:\n${userScript.trim()}\n`, e);
        emitError(e);
      }

      // Add any unparented (orphan) bodies to the scene.
      var orphans = _userScript.bodies.filter(function(body) {
        return body.parent == body && _engine.world.bodies.indexOf(body) == -1;
      });
      if (orphans.length > 0) {
        console.log(`Found ${orphans.length} orphans.`)
        for (var index in orphans) {
          var orphan = orphans[index];
          console.log(`Attempting to add id #${orphan.id}: `, orphan)
          Matter.World.add.call(Matter.World, _engine.world, orphan);
        }
      }

      if (scriptEventCallbacks) {
        if (typeof scriptEventCallbacks['doBeforeUpdate'] === 'function') {
          Matter.Events.on(_engine, 'beforeUpdate', function() {
            scriptEventCallbacks.doBeforeUpdate(_engine.timing.timestamp / 1000);
            // TODO: add new orphan bodies
          });
        }
        if (typeof scriptEventCallbacks['doAfterUpdate'] === 'function') {
          Matter.Events.on(_engine, 'afterUpdate', function() {
            scriptEventCallbacks.doAfterUpdate(_engine.timing.timestamp / 1000);
            // TODO: add new orphan bodies
          });
        }
        if (typeof scriptEventCallbacks['doBeforeRender'] === 'function') {
          Matter.Events.on(_renderer, 'beforeRender', function() {
            scriptEventCallbacks.doBeforeRender(_engine.timing.timestamp / 1000);
            // TODO: add new orphan bodies
          });
        }
        if (typeof scriptEventCallbacks['doAfterRender'] === 'function') {
          Matter.Events.on(_renderer, 'afterRender', function() {
            scriptEventCallbacks.doAfterRender(_engine.timing.timestamp / 1000);
            // TODO: add new orphan bodies
          });
        }
      }
    }

    /**
     * Stop the simulation, renderer, and all callbacks.
     */
    function stop() {
      for (var i in _userScript.intervals) {
        window.clearInterval(_userScript.intervals[i]);
      }
      _userScript.intervals = [];

      for (var i in _userScript.timeouts) {
        window.clearTimeout(_userScript.timeouts[i]);
      }
      _userScript.timeouts = [];

      if (_renderer) {
        Matter.Events.off(_renderer);  // Remove all event listeners
        Matter.Render.stop(_renderer);
        _rendering = false;
      }
      if (_engine) {
        Matter.Events.off(_engine);  // Remove all event listeners
      }
      if (_runner) {
        Matter.Runner.stop(_runner);
      }
    }

    /**
     * Clears the world of all objects and resets the background.
     */
    function reset(renderBlankFrame) {
      stop();

      if (_engine) {
        if (_engine.world) {
          _renderer.options.background = 'white';
          Matter.World.clear(_engine.world, false);

          if (renderBlankFrame) {
            Matter.Render.world(_renderer);
          }
        }

        Matter.Engine.clear(_engine);
      }
      _userScript.bodies = [];

    }

    // Exported SimplePhysics members:
    return { run, stop, reset, SimpleBody, Rectangle, Block };
  })();
})();
