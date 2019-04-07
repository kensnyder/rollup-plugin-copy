import { rollup } from 'rollup'
import fs from 'fs-extra'
import { green } from 'chalk'
import copy from '../src'

process.chdir(`${__dirname}/fixtures`)

async function build(copyOptions, buildOptions = {}) {
  const chunks = buildOptions.chunks || false
  const dir = buildOptions.dir || false

  const bundle = !chunks
    ? await rollup({
      input: 'src/index.js',
      plugins: [
        copy(copyOptions)
      ]
    })
    : await rollup({
      input: [
        'src/index.js',
        'src/chunk-1.js'
      ],
      plugins: [
        copy(copyOptions)
      ]
    })

  if (!dir && !chunks) {
    await bundle.write({
      file: 'dist/index.js',
      format: 'commonjs'
    })
  } else {
    await bundle.write({
      dir: 'build',
      format: 'commonjs'
    })
  }
}

beforeEach(async () => {
  await fs.remove('build')
  await fs.remove('dist')
  await fs.remove('lib')
})

afterAll(async () => {
  await fs.remove('build')
  await fs.remove('dist')
  await fs.remove('lib')
})

test('No options passed', async () => {
  await build()

  expect(await fs.pathExists('dist/asset-1.js')).toBe(false)
})

describe('Targets is an array', () => {
  test('Empty array', async () => {
    await build({
      targets: []
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(false)
  })

  test('Single file', async () => {
    await build({
      targets: [
        'src/assets/asset-1.js'
      ]
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(true)
  })

  test('Multiple files', async () => {
    await build({
      targets: [
        'src/assets/asset-1.js',
        'src/assets/asset-2.js'
      ]
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(true)
    expect(await fs.pathExists('dist/asset-2.js')).toBe(true)
  })

  test('Folders', async () => {
    await build({
      targets: [
        'src/assets/css',
        'src/assets/scss'
      ]
    })

    expect(await fs.pathExists('dist/css')).toBe(true)
    expect(await fs.pathExists('dist/css/css-1.css')).toBe(true)
    expect(await fs.pathExists('dist/css/css-2.css')).toBe(true)
    expect(await fs.pathExists('dist/scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/scss-1.scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/scss-2.scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/nested')).toBe(true)
    expect(await fs.pathExists('dist/scss/nested/scss-3.scss')).toBe(true)
  })

  test('Ouput.dir is used', async () => {
    await build({
      targets: [
        'src/assets/asset-1.js',
        'src/assets/asset-2.js',
        'src/assets/css'
      ]
    }, {
      dir: true
    })

    expect(await fs.pathExists('build/asset-1.js')).toBe(true)
    expect(await fs.pathExists('build/asset-2.js')).toBe(true)
    expect(await fs.pathExists('build/css')).toBe(true)
    expect(await fs.pathExists('build/css/css-1.css')).toBe(true)
    expect(await fs.pathExists('build/css/css-2.css')).toBe(true)
  })

  test('Multiple input chunks are used', async () => {
    await build({
      targets: [
        'src/assets/asset-1.js',
        'src/assets/asset-2.js',
        'src/assets/css'
      ]
    }, {
      chunks: true
    })

    expect(await fs.pathExists('build/asset-1.js')).toBe(true)
    expect(await fs.pathExists('build/asset-2.js')).toBe(true)
    expect(await fs.pathExists('build/css')).toBe(true)
    expect(await fs.pathExists('build/css/css-1.css')).toBe(true)
    expect(await fs.pathExists('build/css/css-2.css')).toBe(true)
  })

  test('Throw if file doesn\'t exist', async () => {
    await expect(build({
      targets: [
        'src/assets/asset-3.js'
      ]
    })).rejects.toThrow('ENOENT: no such file or directory, stat \'src/assets/asset-3.js\'')
  })

  test('Throw if folder doesn\'t exist', async () => {
    await expect(build({
      targets: [
        'src/assets/js'
      ]
    })).rejects.toThrow('ENOENT: no such file or directory, stat \'src/assets/js\'')
  })
})

describe('Targets is an object', () => {
  test('Empty object', async () => {
    await build({
      targets: {}
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(false)
  })

  test('Single file', async () => {
    await build({
      targets: {
        'src/assets/asset-1.js': 'dist/asset-1.js'
      }
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(true)
  })

  test('Multiple files', async () => {
    await build({
      targets: {
        'src/assets/asset-1.js': 'dist/asset-1.js',
        'src/assets/asset-2.js': 'dist/asset-2.js'
      }
    })

    expect(await fs.pathExists('dist/asset-1.js')).toBe(true)
    expect(await fs.pathExists('dist/asset-2.js')).toBe(true)
  })

  test('Folders', async () => {
    await build({
      targets: {
        'src/assets/css': 'dist/css',
        'src/assets/scss': 'dist/scss'
      }
    })

    expect(await fs.pathExists('dist/css')).toBe(true)
    expect(await fs.pathExists('dist/css/css-1.css')).toBe(true)
    expect(await fs.pathExists('dist/css/css-2.css')).toBe(true)
    expect(await fs.pathExists('dist/scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/scss-1.scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/scss-2.scss')).toBe(true)
    expect(await fs.pathExists('dist/scss/nested')).toBe(true)
    expect(await fs.pathExists('dist/scss/nested/scss-3.scss')).toBe(true)
  })

  test('Nested output path', async () => {
    await build({
      targets: {
        'src/assets/scss': 'dist/nested/folder'
      }
    })

    expect(await fs.pathExists('dist/nested/folder')).toBe(true)
    expect(await fs.pathExists('dist/nested/folder/scss-1.scss')).toBe(true)
    expect(await fs.pathExists('dist/nested/folder/scss-2.scss')).toBe(true)
    expect(await fs.pathExists('dist/nested/folder/nested')).toBe(true)
    expect(await fs.pathExists('dist/nested/folder/nested/scss-3.scss')).toBe(true)
  })

  test('Non-existing output path', async () => {
    await build({
      targets: {
        'src/assets/asset-1.js': 'lib/assets/asset-1.js',
        'src/assets/css': 'build/assets'
      }
    })

    expect(await fs.pathExists('lib/assets/asset-1.js')).toBe(true)
    expect(await fs.pathExists('build/assets')).toBe(true)
    expect(await fs.pathExists('build/assets/css-1.css')).toBe(true)
    expect(await fs.pathExists('build/assets/css-2.css')).toBe(true)
  })

  test('Throw if file doesn\'t exist', async () => {
    await expect(build({
      targets: {
        'src/assets/asset-3.js': 'dist/assets'
      }
    })).rejects.toThrow('ENOENT: no such file or directory, stat \'src/assets/asset-3.js\'')
  })

  test('Throw if folder doesn\'t exist', async () => {
    await expect(build({
      targets: {
        'src/assets/js': 'dist/assets'
      }
    })).rejects.toThrow('ENOENT: no such file or directory, stat \'src/assets/js\'')
  })
})

describe('Options', () => {
  test('Output folder, targets is an array', async () => {
    await build({
      targets: [
        'src/assets/asset-1.js',
        'src/assets/asset-2.js',
        'src/assets/scss'
      ],
      outputFolder: 'dist/assets'
    })

    expect(await fs.pathExists('dist/assets/asset-1.js')).toBe(true)
    expect(await fs.pathExists('dist/assets/asset-2.js')).toBe(true)
    expect(await fs.pathExists('dist/assets/scss')).toBe(true)
    expect(await fs.pathExists('dist/assets/scss/scss-1.scss')).toBe(true)
    expect(await fs.pathExists('dist/assets/scss/scss-2.scss')).toBe(true)
    expect(await fs.pathExists('dist/assets/scss/nested')).toBe(true)
    expect(await fs.pathExists('dist/assets/scss/nested/scss-3.scss')).toBe(true)
  })

  test('Output folder, targets is an object', async () => {
    await build({
      targets: {
        'src/assets/asset-1.js': 'js/asset-1.js',
        'src/assets/scss': 'styles'
      },
      outputFolder: 'dist/assets'
    })

    expect(await fs.pathExists('dist/assets/js/asset-1.js')).toBe(true)
    expect(await fs.pathExists('dist/assets/styles')).toBe(true)
    expect(await fs.pathExists('dist/assets/styles/scss-1.scss')).toBe(true)
    expect(await fs.pathExists('dist/assets/styles/scss-2.scss')).toBe(true)
    expect(await fs.pathExists('dist/assets/styles/nested')).toBe(true)
    expect(await fs.pathExists('dist/assets/styles/nested/scss-3.scss')).toBe(true)
  })

  /* eslint-disable no-console */
  test('Verbose', async () => {
    console.log = jest.fn()

    await build({
      targets: [
        'src/assets/asset-1.js',
        'src/assets/scss'
      ],
      verbose: true
    })

    expect(console.log).toHaveBeenCalledTimes(3)
    expect(console.log).toHaveBeenCalledWith('Copied files and folders:')
    expect(console.log).toHaveBeenCalledWith(green('src/assets/asset-1.js -> dist/asset-1.js'))
    expect(console.log).toHaveBeenCalledWith(green('src/assets/scss -> dist/scss'))
  })
  /* eslint-enable no-console */
})
