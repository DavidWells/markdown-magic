const { gitDetails } = require('git-er-done')

/**
 * Detects changed packages in CI environments (GitHub Actions, etc.)
 * Handles both PR and push events
 */
async function detectChangedPackagesInCI() {
  const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request'
  const isPush = process.env.GITHUB_EVENT_NAME === 'push'

  let gitInfo

  try {
    if (isPR) {
      // For PRs: Compare PR branch against base branch (e.g., feature-branch vs master)
      const baseBranch = process.env.GITHUB_BASE_REF || 'master'
      const headBranch = process.env.GITHUB_HEAD_REF || 'HEAD'

      console.log(`🔀 Pull Request detected`)
      console.log(`   Comparing: ${headBranch} → ${baseBranch}\n`)

      // Use origin/ prefix for remote branches
      gitInfo = await gitDetails({
        base: `origin/${baseBranch}`,
        head: 'HEAD'
      })

    } else if (isPush) {
      // For pushes to master: Compare current commit against previous commit
      const beforeSHA = process.env.GITHUB_EVENT_BEFORE || 'HEAD^'
      const afterSHA = process.env.GITHUB_SHA || 'HEAD'

      console.log(`⬆️  Push detected`)
      console.log(`   Comparing: ${beforeSHA.substring(0, 7)} → ${afterSHA.substring(0, 7)}\n`)

      gitInfo = await gitDetails({
        base: beforeSHA,
        head: afterSHA
      })

    } else {
      // Fallback: Compare against master for local testing
      console.log(`💻 Local/Other environment detected`)
      console.log(`   Comparing: working changes → master\n`)

      gitInfo = await gitDetails({
        base: 'master',
        includeWorkingChanges: true
      })
    }
  } catch (err) {
    console.error('❌ Error getting git info')
    console.error(err)
    process.exit(1)
  }

  console.log('📦 Monorepo Package Change Detection')
  console.log('═══════════════════════════════════════\n')

  // Get all changed files
  const allChangedFiles = [
    ...gitInfo.modifiedFiles,
    ...gitInfo.createdFiles,
    ...gitInfo.deletedFiles
  ]

  if (allChangedFiles.length === 0) {
    console.log('✅ No files changed')
    return { packages: [], allChangedFiles: [] }
  }

  console.log(`📝 Total files changed: ${allChangedFiles.length}\n`)

  for (const file of allChangedFiles) {
    console.log(`📝 ${file}`)
  }

  // Extract package names from paths
  const changedPackages = new Set()
  const packageFiles = {}

  allChangedFiles.forEach(file => {
    // Match patterns like "packages/*/..." or "components/*/..."
    const match = file.match(/^(packages|components)\/([^\/]+)/)
    if (match) {
      const packageName = match[2]
      changedPackages.add(packageName)

      if (!packageFiles[packageName]) {
        packageFiles[packageName] = {
          modified: [],
          created: [],
          deleted: []
        }
      }

      if (gitInfo.modifiedFiles.includes(file)) {
        packageFiles[packageName].modified.push(file)
      } else if (gitInfo.createdFiles.includes(file)) {
        packageFiles[packageName].created.push(file)
      } else if (gitInfo.deletedFiles.includes(file)) {
        packageFiles[packageName].deleted.push(file)
      }
    }
  })

  if (changedPackages.size === 0) {
    console.log('✅ No packages changed (only root-level files)')
    return { packages: [], allChangedFiles }
  }

  console.log(`🎯 ${changedPackages.size} package(s) changed:\n`)

  // Sort and display each package
  const packageList = Array.from(changedPackages).sort()
  packageList.forEach(packageName => {
    const files = packageFiles[packageName]
    const totalFiles = files.modified.length + files.created.length + files.deleted.length

    console.log(`📦 ${packageName}`)
    console.log(`   Files: ${totalFiles} changed`)
    console.log(`   • ${files.modified.length} modified`)
    console.log(`   • ${files.created.length} created`)
    console.log(`   • ${files.deleted.length} deleted`)

    // Check for important file changes
    const hasPackageJson = [...files.modified, ...files.created].some(f => f.includes('package.json'))
    const hasTests = [...files.modified, ...files.created].some(f => f.includes('.test.') || f.includes('.spec.'))
    const hasSrcChanges = [...files.modified, ...files.created].some(f => f.includes('/src/'))

    if (hasPackageJson) console.log('   ⚠️  Dependencies changed')
    if (hasSrcChanges) console.log('   📝 Source code changed')
    if (hasTests) console.log('   ✅ Tests updated')
    if (hasSrcChanges && !hasTests) console.log('   ⚠️  Consider updating tests')

    console.log()
  })

  console.log('═══════════════════════════════════════\n')

  // For GitHub Actions: Set output
  if (process.env.GITHUB_OUTPUT) {
    const fs = require('fs')
    const output = [
      `packages=${packageList.join(',')}`,
      `count=${changedPackages.size}`,
      `json=${JSON.stringify(packageList)}`
    ].join('\n')

    fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n')
    console.log('📤 GitHub Actions outputs set:')
    console.log(`   packages: ${packageList.join(',')}`)
    console.log(`   count: ${changedPackages.size}`)
    console.log(`   json: ${JSON.stringify(packageList)}\n`)
  }

  // Return data for programmatic use
  return {
    packages: packageList,
    packageFiles,
    allChangedFiles
  }
}

// Run if called directly
if (require.main === module) {
  detectChangedPackagesInCI()
    .then(result => {
      if (result.packages.length > 0) {
        console.log('🔧 Next steps in CI:')
        result.packages.forEach(pkg => {
          console.log(`   • Run tests for ${pkg}`)
          console.log(`   • Build ${pkg}`)
        })
      }
      process.exit(0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}

module.exports = { detectChangedPackagesInCI }
