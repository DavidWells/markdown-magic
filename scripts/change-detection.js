const path = require('path')
const { gitDetails } = require('git-er-done')

async function detectChangedPackages() {
  let gitInfo
  try {
    // Compare against uncommitted working directory changes:
    gitInfo = await gitDetails({ base: 'master', includeWorkingChanges: true })

    // Alternatively, to compare between commits use:
    // gitInfo = await gitDetails({ base: 'master', head: 'HEAD' })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  console.log('📦 Monorepo Package Change Detection\n')
  console.log('═══════════════════════════════════════\n')

  // Get all changed files
  const allChangedFiles = [
    ...gitInfo.modifiedFiles,
    ...gitInfo.createdFiles,
    ...gitInfo.deletedFiles
  ]

  // Extract package names from paths
  // Assumes structure like: packages/package-name/... or components/component-name/...
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
    console.log('✅ No packages changed')
    return
  }

  console.log(`🎯 ${changedPackages.size} package(s) changed:\n`)

  // Sort and display each package
  Array.from(changedPackages).sort().forEach(packageName => {
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

  console.log('═══════════════════════════════════════')
  console.log('\n🔧 Recommended Actions:\n')

  changedPackages.forEach(packageName => {
    const files = packageFiles[packageName]
    const hasPackageJson = [...files.modified, ...files.created].some(f => f.includes('package.json'))
    const hasSrcChanges = [...files.modified, ...files.created].some(f => f.includes('/src/'))

    if (hasPackageJson) {
      console.log(`   • Reinstall dependencies in ${packageName}`)
    }
    if (hasSrcChanges) {
      console.log(`   • Test ${packageName}`)
      console.log(`   • Build ${packageName}`)
      console.log(`   • Consider version bump for ${packageName}`)
    }
  })

  // Export package list for CI/CD
  console.log('\n📋 Package list (for CI/CD):')
  for (const packageName of changedPackages) {
    console.log(`- ${packageName}`)
  }
}

detectChangedPackages()
