#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const program = require('commander')
const chalk = require('chalk')
const {getPkgItemByKey} = require('../src/util')
const ora = require('ora')
const exec = require('child_process').exec
const getLatestVersion = require('latest-version')
const {PROJECT_CONFIG} = require('../src/util')
const projectConfPath = path.join(process.cwd(), PROJECT_CONFIG)
const pkgPath = path.join(process.cwd(), 'package.json')
const {shouldUseYarn, shouldUseCnpm} = require('../src/util')

const pkgName = getPkgItemByKey('name')

// 这里没有使用 command 的形式：taro-update-self
program.parse(process.argv)

const args = program.args

if (args.length === 1) {
  switch (args[0]) {
    case 'self': {
      updateSelf()
      break
    }
    case 'project': {
      updateProject()
      break
    }
    default:
      info()
  }
} else {
  info()
}

function info () {
  console.log()
  console.log(chalk.red('Commnd error:'))
  console.log(`${chalk.green('taro update self')} Update package @tarojs/cli to the latest`)
  console.log(`${chalk.green('taro update project')} Update all of packages in Project @taro/* to the latest`)
}

function updateSelf () {
  console.log(chalk.green('Update package @tarojs/cli to the latest...'))
  let command
  if (shouldUseYarn()) {
    command = 'yarn global add @tarojs/cli@latest'
  } else if (shouldUseCnpm()) {
    command = 'cnpm i -g @tarojs/cli@latest'
  } else {
    command = 'npm i -g @tarojs/cli@latest'
  }

  let child = exec(command)

  const spinner = ora('update packages...').start()

  child.stdout.on('data', function (data) {
    console.log(data)
    spinner.stop()
  })
  child.stderr.on('data', function (data) {
    console.log(data)
    spinner.stop()
  })
}

async function updateProject () {
  if (!fs.existsSync(projectConfPath)) {
    console.log(chalk.red(`找不到项目配置文件${PROJECT_CONFIG}，请确定当前目录是Taro项目根目录!`))
    process.exit(1)
  }
  const packageMap = require(pkgPath)

  const version = await getLatestVersion(pkgName)

  // 更新 @tarojs/* 版本
  Object.keys(packageMap.dependencies).forEach((key) => {
    if (key.indexOf('@tarojs/') !== -1) {
      packageMap.dependencies[key] = version
    }
  })
  Object.keys(packageMap.devDependencies).forEach((key) => {
    if (key.indexOf('@tarojs/') !== -1) {
      packageMap.devDependencies[key] = version
    }
  })

  // 写入package.json
  try {
    await fs.writeJson(pkgPath, packageMap, {spaces: '\t'})
    console.log()
    console.log('update package.json success!')
  } catch (err) {
    console.error(err)
  }

  // npm install
  console.log(chalk.green('Update all of packages in Project @taro/* to the latest...'))

  let command
  if (shouldUseYarn()) {
    command = 'yarn install'
  } else if (shouldUseCnpm()) {
    command = 'cnpm install'
  } else {
    command = 'npm install'
  }

  let child = exec(command)

  const spinner = ora('update packages...').start()

  child.stdout.on('data', function (data) {
    console.log(data)
    spinner.stop()
  })
  child.stderr.on('data', function (data) {
    console.log(data)
    spinner.stop()
  })
}
