export = contributors;
/**
 * ### > CONTRIBUTORS
 *
 * Generate a table of GitHub repository contributors automatically
 *
 * **Options:**
 * - `repo` (optional): GitHub repository in format `owner/repo`. Default: auto-detected from git remote
 * - `format` (optional): Output format. Options: `table`, `list`, `aligned`. Default: `table`
 * - `token` (optional): GitHub API token for authentication. Default: uses GITHUB_TOKEN env var
 *
 * **Example:**
 * ```md
 * <!-- doc-gen CONTRIBUTORS -->
 * Contributors table will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * ```md
 * <!-- doc-gen CONTRIBUTORS format=list -->
 * Contributors list will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * ```md
 * <!-- doc-gen CONTRIBUTORS repo=owner/reponame format=aligned -->
 * Contributors table will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * Default `matchWord` is `CONTRIBUTORS`
 *
 * ---
 * @typedef {Object} ContributorsOptions
 * @property {string} [format='table'] - Output format: 'table', 'list', or 'aligned'
 * @property {string} [repo] - GitHub repository in format 'owner/repo' (auto-detected if not provided)
 * @property {string} [token] - GitHub token for API authentication (uses GITHUB_TOKEN env var if not provided)
 *
 * @param {object} api The markdown-magic API object
 * @param {string} api.content The current content of the comment block
 * @param {ContributorsOptions} api.options The options passed in from the comment declaration
 * @param {string} api.originalPath The path of the file being processed
 * @param {string} api.currentFileContent The full content of the file being processed
 * @return {Promise<string>} Contributors content in markdown format
 */
declare function contributors({ content, options, originalPath, currentFileContent }: {
    content: string;
    options: ContributorsOptions;
    originalPath: string;
    currentFileContent: string;
}): Promise<string>;
declare namespace contributors {
    export { ContributorsOptions };
}
/**
 * ### > CONTRIBUTORS
 *
 * Generate a table of GitHub repository contributors automatically
 *
 * **Options:**
 * - `repo` (optional): GitHub repository in format `owner/repo`. Default: auto-detected from git remote
 * - `format` (optional): Output format. Options: `table`, `list`, `aligned`. Default: `table`
 * - `token` (optional): GitHub API token for authentication. Default: uses GITHUB_TOKEN env var
 *
 * **Example:**
 * ```md
 * <!-- doc-gen CONTRIBUTORS -->
 * Contributors table will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * ```md
 * <!-- doc-gen CONTRIBUTORS format=list -->
 * Contributors list will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * ```md
 * <!-- doc-gen CONTRIBUTORS repo=owner/reponame format=aligned -->
 * Contributors table will be generated here
 * <!-- /doc-gen -->
 * ```
 *
 * Default `matchWord` is `CONTRIBUTORS`
 *
 * ---
 */
type ContributorsOptions = {
    /**
     * - Output format: 'table', 'list', or 'aligned'
     */
    format?: string | undefined;
    /**
     * - GitHub repository in format 'owner/repo' (auto-detected if not provided)
     */
    repo?: string | undefined;
    /**
     * - GitHub token for API authentication (uses GITHUB_TOKEN env var if not provided)
     */
    token?: string | undefined;
};
