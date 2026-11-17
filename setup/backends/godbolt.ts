import { CodeRunnerOutput } from '@slidev/types';

import packageJson from "../../package.json";

import {
  CConfig,
  CppConfig,
  SupportedLanguages,
  validateConfig
} from './config';

/**
 * Godbolt compiler entry from the /api/compilers endpoint
 */
interface GodboltCompiler {
  id: string;
  name: string;
  semver: string;
  releaseTrack?: string;
}

/**
 * Godbolt compile ( executor request ) response
 */
interface GodboltResult {
  code: number;
  didExecute?: boolean;
  stdout?: { text: string }[];
  stderr?: { text: string }[];
  buildResult?: {
    code: number;
    stderr?: { text: string }[];
    stdout?: { text: string }[];
  };
}

// Compiler Explorer language ids
const GODBOLT_LANGUAGES: Record<SupportedLanguages, string> = {
  c: 'c',
  cpp: 'c++'
};

// Cached compiler list promise, keyed by slide language
const compilerCache = new Map<SupportedLanguages, Promise<GodboltCompiler[]>>();

// Joins a Godbolt output segment ( array of { text } ) into a single string
const joinOutput = (segments?: { text: string }[]): string =>
  (segments || []).map(segment => segment.text).join('').trimEnd();

//shortcut: '-latomic' is a no-op in Compiler Explorer sandboxes and absent in some images, re-add if a slide needs it
const stripNoopFlags = (flags: string): string =>
  flags.split(/\s+/).filter(flag => flag && flag !== '-latomic').join(' ');

/**
 * Fetches the compiler list for a language, cached for subsequent runs
 */
const fetchCompilers = (language: SupportedLanguages): Promise<GodboltCompiler[]> => {
  const cached = compilerCache.get(language);
  if (cached)
    return cached;

  const langId = GODBOLT_LANGUAGES[language];
  const request = fetch(`${packageJson.config.godbolt.url}/compilers/${langId}?fields=id,name,semver,releaseTrack`, {
    headers: { Accept: 'application/json' },
    cache: 'default',
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Godbolt compiler list failed: HTTP ${response.status}`);
    }

    return response.json() as Promise<GodboltCompiler[]>;
  });

  compilerCache.set(language, request);
  return request;
};

/**
 * Compares two semver strings ( e.g. '13.2.0' )
 */
const compareSemver = (a: string, b: string): number => {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  const longestLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < longestLength; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0)
      return diff;
  }

  return 0;
};

/**
 * Resolves the logical compiler name ( e.g. 'g++' ) to a Godbolt compiler id
 */
const resolveCompilerId = async (config: CppConfig | CConfig, language: SupportedLanguages): Promise<string> => {
  // Explicit id from the slide frontmatter takes precedence
  if (config.compilerId)
    return config.compilerId;

  const compiler = (config.compiler || 'g++') as string;
  const family = compiler.startsWith('clang') ? 'clang' : 'gcc';

  const compilers = await fetchCompilers(language);

  const candidates = compilers.filter(candidate =>
    candidate.name.toLowerCase().includes(`x86-64 ${family}`) &&
    (!candidate.releaseTrack || candidate.releaseTrack === 'stable'));

  if (candidates.length === 0) {
    throw new Error(`No Godbolt compiler found for '${compiler}' (${language})`);
  }

  const newest = candidates.reduce((best, candidate) =>
    compareSemver(candidate.semver || '0', best.semver || '0') > 0 ? candidate : best);

  return newest.id;
};

/**
 * Builds the user arguments string from the slide configuration
 */
const buildUserArguments = (config: CppConfig | CConfig, language: SupportedLanguages): string => {
  const validatedConfig = validateConfig(config, language);
  const standard = validatedConfig.standard || (language === 'cpp' ? 'c++20' : 'c2x');

  const components = {
    standard: `-std=${standard}`,
    optimization: validatedConfig.optimization ? `-${validatedConfig.optimization}` : '',
    stdlib: ((validatedConfig.compiler as string || '').startsWith('clang') && validatedConfig.useStdLib)
      ? '-stdlib=libc++' : '',
    flags: validatedConfig.flags ? stripNoopFlags(validatedConfig.flags) : '',
    libraries: validatedConfig.libraries ? stripNoopFlags(validatedConfig.libraries) : ''
  };

  return Object.values(components).filter(Boolean).join(' ');
};

/**
 * Runs code through the Godbolt ( Compiler Explorer ) service
 */
export const runOnGodbolt = async (code: string, language: SupportedLanguages, config: CppConfig | CConfig):
  Promise<CodeRunnerOutput> => {
  try {
    const compilerId = await resolveCompilerId(config, language);
    const langId = GODBOLT_LANGUAGES[language];

    // Executor request: compile and run the program in Compiler Explorer's sandbox
    const response = await fetch(`${packageJson.config.godbolt.url}/compiler/${compilerId}/compile`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: code + "\n",
        lang: langId,
        options: {
          userArguments: buildUserArguments(config, language),
          compilerOptions: { executorRequest: true },
          filters: { execute: true },
          executeParameters: {
            args: [],
            stdin: ''
          }
        }
      }),
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`Godbolt request failed: HTTP ${response.status}`);
    }

    const result = await response.json() as GodboltResult;

    // Compilation errors live in buildResult when using executor requests
    if (result.buildResult && result.buildResult.code !== 0) {
      const buildErrors = joinOutput(result.buildResult.stderr) ||
        `Compilation failed with code ${result.buildResult.code}`;

      return {
        text: buildErrors,
        highlightLang: 'ansi',
      };
    }

    const text = [joinOutput(result.stderr), joinOutput(result.stdout)]
      .filter(Boolean).join("\n");

    // Program exit code from the executed run
    const exitCode = result.code;

    return {
      text: exitCode !== 0 ? `${text}\nProgram returned: ${exitCode}` : text,
      highlightLang: 'ansi',
    };
  }
  catch (error) {
    return {
      text: error instanceof Error ? error.message : String(error),
      class: 'text-red',
    };
  }
};
