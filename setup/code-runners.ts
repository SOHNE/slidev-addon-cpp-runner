import { CodeRunnerContext, CodeRunnerOutput, CodeRunnerProviders, defineCodeRunnersSetup } from '@slidev/types';
import { ref } from 'vue';
import { useNav } from '@slidev/client';

import packageJson from "../package.json";

/**
 * Type definitions for C/C++ compiler configurations
 */
// Supported languages
type SupportedLanguages = 'c' | 'cpp';

// Supported C++ standards
type CppStandard = 'c++98' | 'c++03' | 'c++11' | 'c++14' | 'c++17' | 'c++20' | 'c++23' | 'c++1z';

// Supported C standards
type CStandard = 'c89' | 'c99' | 'c11' | 'c17' | 'c2x';

// Supported compiler optimization levels
type OptimizationLevel = 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Og' | 'Ofast';

// Supported C++ compilers
type CppCompiler = 'g++' | 'clang++' | 'g++-4.9' | 'g++-5.2';

// Supported C compilers
type CCompiler = 'gcc' | 'clang' | 'gcc-4.9' | 'g++-4.9' | 'g++-5.2' | 'clang++';

// Base configuration interface shared by both C and C++
interface BaseCompilerConfig {
  optimization?: OptimizationLevel;
  flags?: string;
  libraries?: string;
  extraCommands?: string;
  alwaysShowCompilerOutput?: boolean;
  useStdLib?: boolean; // For clang++ to use -stdlib=libc++
}

// C++ specific configuration
interface CppConfig extends BaseCompilerConfig {
  compiler?: CppCompiler;
  standard?: CppStandard;
}

// C specific configuration
interface CConfig extends BaseCompilerConfig {
  compiler?: CCompiler;
  standard?: CStandard;
}

// Union type for slide frontmatter
interface SlideFrontmatter {
  cpp?: Partial<CppConfig>;
  c?: Partial<CConfig>;
}

/**
 * Compiler support configuration
 */
interface CompilerSupport {
  name: string;
  standards: string[];
  stdlibFlag?: string;
  additionalLibs?: Record<string, string>;
}

// Common configuration options
const COMMON_FLAGS = '-Wall -Wextra -pedantic -pthread -pedantic-errors';
const COMMON_LIBRARIES = '-lm';
const DEFAULT_OPTIMIZATION = 'O2';

// Command output formats
const OUTPUT_FORMATS = {
  ALWAYS_SHOW: '2>&1 | sed "s/^/☘ /"; if [ -x a.out ]; then ./a.out | sed "s/^/☢ /"; fi',
  DEFAULT: '&& ./a.out'
};

// Compiler support definitions
const COMPILER_SUPPORT: Record<SupportedLanguages, CompilerSupport[]> = {
  cpp: [
    {
      name: 'g++-4.9',
      standards: ['c++98', 'c++11', 'c++14'],
      additionalLibs: {
        'c++11': '-latomic',
        'c++14': '-latomic',
      }
    },
    {
      name: 'g++-5.2',
      standards: ['c++98', 'c++11', 'c++14', 'c++1z'],
      additionalLibs: {
        'c++11': '-latomic',
        'c++14': '-latomic',
        'c++1z': '-latomic',
      }
    },
    {
      name: 'g++',
      standards: ['c++98', 'c++11', 'c++14', 'c++17', 'c++20', 'c++23'],
      additionalLibs: {
        'c++11': '-latomic',
        'c++14': '-latomic',
        'c++17': '-latomic',
        'c++20': '-latomic',
        'c++23': '-latomic',
      }
    },
    {
      name: 'clang++',
      standards: ['c++98', 'c++11', 'c++14', 'c++17'],
      stdlibFlag: '-stdlib=libc++',
      additionalLibs: {
        'c++11': '-latomic -lsupc++',
        'c++14': '-latomic -lsupc++',
        'c++17': '-latomic -lsupc++',
      }
    }
  ],
  c: [
    {
      name: 'gcc-4.9',
      standards: ['c89', 'c99', 'c11'],
      additionalLibs: {
        'c11': '-latomic',
      }
    },
    {
      name: 'g++-4.9',
      standards: ['c89', 'c99', 'c11'],
      additionalLibs: {
        'c11': '-latomic',
      }
    },
    {
      name: 'g++-5.2',
      standards: ['c89', 'c99', 'c11'],
      additionalLibs: {
        'c11': '-latomic',
      }
    },
    {
      name: 'g++',
      standards: ['c89', 'c99', 'c11', 'c17', 'c2x'],
      additionalLibs: {
        'c11': '-latomic',
        'c17': '-latomic',
        'c2x': '-latomic',
      }
    },
    { name: 'clang', standards: ['c89'] },
    {
      name: 'clang++',
      standards: ['c99', 'c11'],
      additionalLibs: {
        'c11': '-latomic',
      }
    }
  ]
};

export default defineCodeRunnersSetup((runners: CodeRunnerProviders) => {
  return {};
});

