import { colorscales } from './colorscales';
import { parse as parseArithmetics } from './arithmetics-parser';
// @ts-ignore
import * as vertexShaderSource from '../../shaders/plotty.vertex.glsl';
// @ts-ignore
import * as fragmentShaderSource from '../../shaders/plotty.fragment.glsl';

function hasOwnProperty(obj: any, prop: any) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * set default value
 * @param arg
 * @param val
 */
function defaultFor(arg: any, val: any) { return typeof arg !== 'undefined' ? arg : val; }

/**
 * get webgl context
 * @param canvas
 * @param optAttribs
 */
function create3DContext(canvas: HTMLCanvasElement, optAttribs?: WebGLContextAttributes) {
  const names = ['webgl', 'experimental-webgl'];
  let context: WebGLRenderingContext | undefined = undefined;
  for (let ii = 0; ii < names.length; ++ii) {
    try {
      // @ts-ignore
      context = canvas.getContext(names[ii], optAttribs);
    } catch (e) {}  // eslint-disable-line
    if (context) {
      break;
    }
  }
  if (!context || !context.getExtension('OES_texture_float')) {
    return null;
  }
  return context;
}

/**
 * create and compile shader
 * @param gl
 * @param vertexShaderSource
 * @param fragmentShaderSource
 */
function createProgram(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  // create the shader program
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return null;
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    // @ts-ignore
    throw new Error(gl.getShaderInfoLog(vertexShader));
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) return null;
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    // @ts-ignore
    throw new Error(gl.getShaderInfoLog(fragmentShader));
  }

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

/**
 * bind buffer data by rect
 * @param gl
 * @param x
 * @param y
 * @param width
 * @param height
 */
function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW);
}

/**
 * create texture data
 * @param gl
 * @param id
 * @param data
 * @param width
 * @param height
 */
function createDataset(gl: WebGLRenderingContext, id: string | null, data: any, width: number, height: number) {
  let textureData;
  if (gl) {
    gl.viewport(0, 0, width, height);
    textureData = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureData);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.LUMINANCE,
      width, height, 0,
      gl.LUMINANCE, gl.FLOAT, new Float32Array(data),
    );
  }
  return { textureData, width, height, data, id };
}

/**
 * delete texture data
 * @param gl
 * @param dataset
 */
function destroyDataset(gl: WebGLRenderingContext, dataset: any) {
  if (gl) {
    gl.deleteTexture(dataset.textureData);
  }
}

/**
 * Add a new colorscale to the list of available colorscales.
 * @memberof module:plotty
 * @param {String} name the name of the newly defined color scale
 * @param {String[]} colors the array containing the colors. Each entry shall
 *                          adhere to the CSS color definitions.
 * @param {Number[]} positions the value position for each of the colors
 */
export function addColorScale(name: string, colors: string[], positions: number[]) {
  if (colors.length !== positions.length) {
    throw new Error('Invalid color scale.');
  }
  colorscales[name] = { colors, positions };
}

/**
 * Render the colorscale to the specified canvas.
 * @memberof module:plotty
 * @param {String} name the name of the color scale to render
 * @param {HTMLCanvasElement} canvas the canvas to render to
 */
function renderColorScaleToCanvas(name: string, canvas: HTMLCanvasElement | HTMLImageElement) {
  const csDef = colorscales[name];
  canvas.height = 1;
  // @ts-ignore
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  if (Object.prototype.toString.call(csDef) === '[object Object]') {
    canvas.width = 256;
    const gradient = ctx.createLinearGradient(0, 0, 256, 1);

    for (let i = 0; i < csDef.colors.length; ++i) {
      gradient.addColorStop(csDef.positions[i], csDef.colors[i]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
  } else if (Object.prototype.toString.call(csDef) === '[object Uint8Array]') {
    canvas.width = 256;
    const imgData = ctx.createImageData(256, 1);
    imgData.data.set(csDef);
    ctx.putImageData(imgData, 0, 0);
  } else {
    throw new Error('Color scale not defined.');
  }
}

export interface PlottyOptions {
  canvas?: HTMLCanvasElement;
  data: any;
  width: number;
  height: number;
  datasets: {
    data: any[];
    width: number;
    height: number;
    length: number;
  };
  colorScaleImage: HTMLCanvasElement | HTMLImageElement;
  colorScale: string;
  domain?: number[];
  clampLow?: boolean;
  clampHigh?: boolean;
  noDataValue: number;
  matrix?: number[];
  useWebGL?: boolean;
}

/**
 * The raster plot class.
 * @memberof module:plotty
 * @constructor
 * @param {Object} options the options to pass to the plot.
 * @param {HTMLCanvasElement} [options.canvas=document.createElement('canvas')]
 *        the canvas to render to
 * @param {TypedArray} [options.data] the raster data to render
 * @param {Number} [options.width] the width of the input raster
 * @param {Number} [options.height] the height of the input raster
 * @param {Object[]} [options.datasets=undefined] a list of named datasets. each
 *         must have 'id', 'data', 'width' and 'height'.
 * @param {(HTMLCanvasElement|HTMLImageElement)} [options.colorScaleImage=undefined]
 *        the color scale image to use
 * @param {String} [options.colorScale] the name of a named color scale to use
 * @param {Number[]} [options.domain=[0, 1]] the value domain to scale the color
 * @param {Boolean} [options.clampLow=true] whether or now values below the domain
 *        shall be clamped
 * @param {Boolean} [options.clampHigh=clampLow] whether or now values above the
 * domain shall be clamped (if not defined defaults to clampLow value)
 * @param {Number} [options.noDataValue = undefined] the no-data value that shall
 *         always be hidden
 * @param {Array} [options.matrix=[1, 0, 0, 0, 1, 0, 0, 0, 1 ]] Transformation matrix
 * @param {Boolean} [options.useWebGL=true] plotty can also function with pure javascript
 *         but it is much slower then using WebGl rendering
 *
 */
class Plotty {
  private currentDataset: any;
  private datasetCollection: {};
  private canvas: HTMLCanvasElement;
  private gl: any;
  private program: WebGLProgram | null;
  private texCoordBuffer: WebGLBuffer | null;
  private ctx: CanvasRenderingContext2D | null;
  private matrix: number[];
  private domain: number[];
  private colorScaleImage: HTMLCanvasElement | HTMLImageElement;
  private colorScaleCanvas: HTMLCanvasElement;
  public name: string;
  private clampHigh: boolean;
  private clampLow: boolean;
  private textureScale: WebGLTexture;
  private noDataValue: number;
  private expressionAst: string | null;

  constructor(options: PlottyOptions) {
    this.datasetCollection = {};
    this.currentDataset = null;

    this.setCanvas(options.canvas);
    // check if a webgl context is requested and available and set up the shaders
    let gl;

    // eslint-disable-next-line no-cond-assign
    if (defaultFor(options.useWebGL, true) && (gl = create3DContext(this.canvas))) {
      this.gl = gl;

      this.program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

      if (!this.program) {
        return;
      }

      gl.useProgram(this.program);

      // look up where the vertex data needs to go.
      const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');

      // provide texture coordinates for the rectangle.
      this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    } else {
      this.ctx = this.canvas.getContext('2d');
    }

    if (options.colorScaleImage) {
      this.setColorScaleImage(options.colorScaleImage);
    } else {
      this.setColorScale(defaultFor(options.colorScale, 'viridis'));
    }
    this.setDomain(defaultFor(options.domain, [0, 1]));
    this.setClamp(defaultFor(options.clampLow, true), options.clampHigh);
    this.setNoDataValue(options.noDataValue);

    if (options.data) {
      const l = options.data.length;
      this.setData(
        options.data,
        defaultFor(options.width, options.data[l - 2]),
        defaultFor(options.height, options.data[l - 2]),
      );
    }

    if (options.datasets) {
      for (let i = 0; i < options.datasets.length; ++i) {
        const ds = options.datasets[i];
        this.addDataset(ds.id, ds.data, ds.width, ds.height);
      }
    }

    if (options.matrix) {
      this.matrix = options.matrix;
    } else {  // if no matrix is provided, supply identity matrix
      this.matrix = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    }
  }

  /**
   * Get the raw data from the currently selected dataset.
   * @returns {TypedArray} the data of the currently selected dataset.
   */
  getData() {
    const dataset = this.currentDataset;
    if (!dataset) {
      throw new Error('No dataset available.');
    }
    return dataset.data;
  }

  /**
   * Query the raw raster data at the specified coordinates.
   * @param {Number} x the x coordinate
   * @param {Number} y the y coordinate
   * @returns {Number} the value at the specified coordinates
   */
  atPoint(x: number, y: number) {
    const dataset = this.currentDataset;
    if (!dataset) {
      throw new Error('No dataset available.');
    } else if (x >= dataset.width || y >= dataset.height) {
      throw new Error('Coordinates are outside of image bounds.');
    }
    return dataset.data[(y * dataset.width) + x];
  }

  /**
   * Set the raw raster data to be rendered. This creates a new unnamed dataset.
   * @param {TypedArray} data the raw raster data. This can be a typed array of
   *                          any type, but will be coerced to Float32Array when
   *                          beeing rendered.
   * @param {int} width the width of the raster image
   * @param {int} height the height of the data
   */
  setData(data: any, width: number, height: number) {
    if (this.currentDataset && this.currentDataset.id === null) {
      destroyDataset(this.gl, this.currentDataset);
    }
    this.currentDataset = createDataset(this.gl, null, data, width, height);
  }

  /**
   * Add a new named dataset. The semantics are the same as with @see setData.
   * @param {string} id the identifier for the dataset.
   * @param {TypedArray} data the raw raster data. This can be a typed array of
   *                          any type, but will be coerced to Float32Array when
   *                          beeing rendered.
   * @param {int} width the width of the raster image
   * @param {int} height the height of the data
   */
  addDataset(id: string, data: any, width: number, height: number) {
    if (this.datasetAvailable(id)) {
      throw new Error(`There is already a dataset registered with id '${id}'`);
    }
    this.datasetCollection[id] = createDataset(this.gl, id, data, width, height);
    if (!this.currentDataset) {
      this.currentDataset = this.datasetCollection[id];
    }
  }

  /**
   * Set the current dataset to be rendered.
   * @param {string} id the identifier of the dataset to be rendered.
   */
  setCurrentDataset(id: string) {
    if (!this.datasetAvailable(id)) {
      throw new Error(`No such dataset registered: '${id}'`);
    }
    if (this.currentDataset && this.currentDataset.id === null) {
      destroyDataset(this.gl, this.currentDataset);
    }
    this.currentDataset = this.datasetCollection[id];
  }

  /**
   * Remove the dataset.
   * @param {string} id the identifier of the dataset to be removed.
   */
  removeDataset(id: string) {
    const dataset = this.datasetCollection[id];
    if (!dataset) {
      throw new Error(`No such dataset registered: '${id}'`);
    }
    destroyDataset(this.gl, dataset);
    if (this.currentDataset === dataset) {
      this.currentDataset = null;
    }
    delete this.datasetCollection[id];
  }

  /**
   * Check if the dataset is available.
   * @param {string} id the identifier of the dataset to check.
   * @returns {Boolean} whether or not a dataset with that identifier is defined
   */
  datasetAvailable(id: string) {
    return hasOwnProperty(this.datasetCollection, id);
  }

  /**
   * Retrieve the rendered color scale image.
   * @returns {(HTMLCanvasElement|HTMLImageElement)} the canvas or image element
   *                                                 for the rendered color scale
   */
  getColorScaleImage() {
    return this.colorScaleImage;
  }

  /**
   * Set the canvas to draw to. When no canvas is supplied, a new canvas element
   * is created.
   * @param {HTMLCanvasElement} [canvas] the canvas element to render to.
   */
  setCanvas(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || document.createElement('canvas');
  }

  /**
   * Set the new value domain for the rendering.
   * @param {float[]} domain the value domain range in the form [low, high]
   */
  setDomain(domain: number[]) {
    if (!domain || domain.length !== 2) {
      throw new Error('Invalid domain specified.');
    }
    this.domain = domain;
  }

  /**
   * Get the canvas that is currently rendered to.
   * @returns {HTMLCanvasElement} the canvas that is currently rendered to.
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Set the currently selected color scale.
   * @param {string} name the name of the colorscale. Must be registered.
   */
  setColorScale(name: string) {
    if (!hasOwnProperty(colorscales, name)) {
      throw new Error(`No such color scale '${name}'`);
    }
    if (!this.colorScaleCanvas) {
      // Create single canvas to render colorscales
      this.colorScaleCanvas = document.createElement('canvas');
      this.colorScaleCanvas.width = 256;
      this.colorScaleCanvas.height = 1;
    }
    renderColorScaleToCanvas(name, this.colorScaleCanvas);
    this.name = name;
    this.setColorScaleImage(this.colorScaleCanvas);
  }

  /**
   * Set the clamping for the lower and the upper border of the values. When
   * clamping is enabled for either side, the values below or above will be
   * clamped to the minimum/maximum color.
   * @param {Boolean} clampLow whether or not the minimum shall be clamped.
   * @param {Boolean} clampHigh whether or not the maxmimum shall be clamped.
   *                            defaults to clampMin.
   */
  setClamp(clampLow: boolean, clampHigh?: boolean) {
    this.clampLow = clampLow;
    this.clampHigh = (typeof clampHigh !== 'undefined') ? clampHigh : clampLow;
  }

  /**
   * Set the currently selected color scale as an image or canvas.
   * @param {(HTMLCanvasElement|HTMLImageElement)} colorScaleImage the new color
   *                                                               scale image
   */
  setColorScaleImage(colorScaleImage: HTMLCanvasElement | HTMLImageElement) {
    this.colorScaleImage = colorScaleImage;
    const gl = this.gl;
    if (gl) {
      if (this.textureScale) {
        gl.deleteTexture(this.textureScale);
      }
      this.textureScale = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.textureScale);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorScaleImage);
    }
  }

  /**
   * Set the no-data-value: a special value that will be rendered transparent.
   * @param {float} noDataValue the no-data-value. Use null to clear a
   *                            previously set no-data-value.
   */
  setNoDataValue(noDataValue: number) {
    this.noDataValue = noDataValue;
  }

  /**
   * Render the map to the specified canvas with the given settings.
   */
  render() {
    const canvas = this.canvas;
    const dataset = this.currentDataset;

    if (!dataset) {
      throw Error('请输入正确的数据！');
    }

    canvas.width = dataset.width;
    canvas.height = dataset.height;

    let ids = null;
    if (this.expressionAst) {
      const idsSet = new Set([]);
      const getIds = (node: any): any => {
        if (typeof node === 'string') {
          // ids should not contain unary operators
          // @ts-ignore
          idsSet.add(node.replace(new RegExp(/[+-]/, 'g'), ''));
        }
        if (typeof node.lhs === 'string') {
          // @ts-ignore
          idsSet.add(node.lhs.replace(new RegExp(/[+-]/, 'g'), ''));
        } else if (typeof node.lhs === 'object') {
          getIds(node.lhs);
        }
        if (typeof node.rhs === 'string') {
          // @ts-ignore
          idsSet.add(node.rhs.replace(new RegExp(/[+-]/, 'g'), ''));
        } else if (typeof node.rhs === 'object') {
          getIds(node.rhs);
        }
      };
      getIds(this.expressionAst);
      ids = Array.from(idsSet);
    }

    let program = null;

    if (this.gl) {
      const gl = this.gl;
      gl.viewport(0, 0, dataset.width, dataset.height);

      if (this.expressionAst && ids && ids.length > 0) {
        const expressionReducer = (node: any): any => {
          if (typeof node === 'object') {
            if (node.op === '**') {
              // math power operator substitution
              return `pow(${expressionReducer(node.lhs)}, ${expressionReducer(node.rhs)})`;
            }
            if (node.fn) {
              return `(${node.fn}(${expressionReducer(node.lhs)}))`;
            }
            return `(${expressionReducer(node.lhs)} ${node.op} ${expressionReducer(node.rhs)})`;
          }
          if (typeof node === 'string') {
            return `${node}_value`;
          }
          return `float(${node})`;
        };

        const compiledExpression = expressionReducer(this.expressionAst);

        // Definition of fragment shader
        const fragmentShaderSourceExpressionTemplate = `
        precision mediump float;
        // our texture
        uniform sampler2D u_textureScale;
        // add all required textures
${ids.map(id => `        uniform sampler2D u_texture_${id};`).join('\n')}
        uniform vec2 u_textureSize;
        uniform vec2 u_domain;
        uniform float u_noDataValue;
        uniform bool u_clampLow;
        uniform bool u_clampHigh;
        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;
        void main() {
${ids.map(id => `          float ${id}_value = texture2D(u_texture_${id}, v_texCoord)[0];`).join('\n')}
          float value = ${compiledExpression};
          if (value == u_noDataValue)
            gl_FragColor = vec4(0.0, 0, 0, 0.0);
          else if ((!u_clampLow && value < u_domain[0]) || (!u_clampHigh && value > u_domain[1]))
            gl_FragColor = vec4(0, 0, 0, 0);
          else {
            float normalisedValue = (value - u_domain[0]) / (u_domain[1] - u_domain[0]);
            gl_FragColor = texture2D(u_textureScale, vec2(normalisedValue, 0));
          }
        }`;
        program = createProgram(gl, vertexShaderSource, fragmentShaderSourceExpressionTemplate);
        gl.useProgram(program);

        gl.uniform1i(gl.getUniformLocation(program, 'u_textureScale'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureScale);
        for (let i = 0; i < ids.length; ++i) {
          const location = i + 1;
          const id = ids[i];
          const ds = this.datasetCollection[id];
          if (!ds) {
            throw new Error(`No such dataset registered: '${id}'`);
          }
          gl.uniform1i(gl.getUniformLocation(program, `u_texture_${id}`), location);
          gl.activeTexture(gl[`TEXTURE${location}`]);
          // @ts-ignore
          gl.bindTexture(gl.TEXTURE_2D, ds.textureData);
        }
      } else {
        program = this.program;
        gl.useProgram(program);
        // set the images
        gl.uniform1i(gl.getUniformLocation(program, 'u_textureData'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'u_textureScale'), 1);

        gl.activeTexture(gl.TEXTURE0);
        // @ts-ignore
        gl.bindTexture(gl.TEXTURE_2D, dataset.textureData);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textureScale);
      }
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const domainLocation = gl.getUniformLocation(program, 'u_domain');
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      const noDataValueLocation = gl.getUniformLocation(program, 'u_noDataValue');
      const clampLowLocation = gl.getUniformLocation(program, 'u_clampLow');
      const clampHighLocation = gl.getUniformLocation(program, 'u_clampHigh');
      const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2fv(domainLocation, this.domain);
      gl.uniform1i(clampLowLocation, this.clampLow);
      gl.uniform1i(clampHighLocation, this.clampHigh);
      gl.uniform1f(noDataValueLocation, this.noDataValue);
      gl.uniformMatrix3fv(matrixLocation, false, this.matrix);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      setRectangle(gl, 0, 0, canvas.width, canvas.height);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (this.ctx) {
      const ctx = this.ctx;
      const w = canvas.width;
      const h = canvas.height;

      const imageData = ctx.createImageData(w, h);

      const trange = this.domain[1] - this.domain[0];
      const steps = this.colorScaleCanvas.width;
      // @ts-ignore
      const csImageData = this.colorScaleCanvas.getContext('2d').getImageData(0, 0, steps, 1).data;
      let alpha;

      const data = dataset.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w) + x;
          // TODO: Possible increase of performance through use of worker threads?

          let c = Math.round(((data[i] - this.domain[0]) / trange) * steps);
          alpha = 255;
          if (c < 0) {
            c = 0;
            if (!this.clampLow) {
              alpha = 0;
            }
          } else if (c > 255) {
            c = 255;
            if (!this.clampHigh) {
              alpha = 0;
            }
          }

          if (data[i] === this.noDataValue) {
            alpha = 0;
          }

          const index = ((y * w) + x) * 4;
          imageData.data[index + 0] = csImageData[c * 4];
          imageData.data[index + 1] = csImageData[(c * 4) + 1];
          imageData.data[index + 2] = csImageData[(c * 4) + 2];
          imageData.data[index + 3] = alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0); // at coords 0,0
    }
  }

  /**
   * Render the specified dataset with the current settings.
   * @param {string} id the identifier of the dataset to render.
   */
  renderDataset(id: string) {
    this.setCurrentDataset(id);
    return this.render();
  }

  /**
   * Get the color for the specified value.
   * @param {flaot} val the value to query the color for.
   * @returns {Array} the 4-tuple: red, green, blue, alpha in the range 0-255.
   */
  getColor(val: number) {
    if (this.colorScaleCanvas) {
      const steps = this.colorScaleCanvas.width;
      // @ts-ignore
      const csImageData = this.colorScaleCanvas.getContext('2d')
        .getImageData(0, 0, steps, 1).data;
      const trange = this.domain[1] - this.domain[0];
      let c = Math.round(((val - this.domain[0]) / trange) * steps);
      let alpha = 255;
      if (c < 0) {
        c = 0;
        if (!this.clampLow) {
          alpha = 0;
        }
      }
      if (c > 255) {
        c = 255;
        if (!this.clampHigh) {
          alpha = 0;
        }
      }

      return [
        csImageData[c * 4],
        csImageData[(c * 4) + 1],
        csImageData[(c * 4) + 2],
        alpha,
      ];
    }

    return undefined;
  }
  /**
   * Sets a mathematical expression to be evaluated on the plot. Expression can contain mathematical operations with
   * integer/float values, dataset identifiers or GLSL supported functions with a single parameter.
   * Supported mathematical operations are: add '+', subtract '-', multiply '*', divide '/', power '**',
   * unary plus '+a', unary minus '-a'.
   * Useful GLSL functions are for example: radians, degrees, sin, asin, cos, acos, tan, atan, log2, log, sqrt, exp2,
   * exp, abs, sign, floor, ceil, fract.
   * @param {string} expression Mathematical expression. Example: '-2 * sin(3.1415 - dataset1) ** 2'
   */
  setExpression(expression: string) {
    if (!expression || !expression.length) {
      this.expressionAst = null;
    } else {
      this.expressionAst = parseArithmetics(expression);
    }
  }
}

export default Plotty;
