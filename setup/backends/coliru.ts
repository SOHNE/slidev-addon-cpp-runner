import { CodeRunnerOutput } from '@slidev/types';

import packageJson from "../../package.json";

import {
  CConfig,
  COMMON_FLAGS,
  COMMON_LIBRARIES,
  DEFAULT_OPTIMIZATION,
  CppConfig,
  OUTPUT_FORMATS,
  SupportedLanguages,
  getAdditionalLibraries,
  getDefaultCompiler,
  getDefaultStandard,
  getCompilerSupport,
  validateConfig
} from './config';

/**
 * Builds the command string for compilation and execution
 */
const buildCommand = (config: CppConfig | CConfig, language: SupportedLanguages): string => {
  // Validate configuration first
  const validatedConfig = validateConfig(config, language);
  const compiler = validatedConfig.compiler || getDefaultCompiler(language);
  const standard = validatedConfig.standard || getDefaultStandard(language);

  // Get compiler support information
  const compilerSupport = getCompilerSupport(compiler as string, language);

  // Build command components
  const components = {
    compiler: compiler,
    langFlag: language === 'cpp' ? '' : '-x c',
    standard: `-std=${standard}`,
    stdlib: (compiler === 'clang++' && validatedConfig.useStdLib) ? compilerSupport?.stdlibFlag || '' : '',
    optimization: validatedConfig.optimization ? `-${validatedConfig.optimization}` : `-${DEFAULT_OPTIMIZATION}`,
    flags: validatedConfig.flags || COMMON_FLAGS,
    sourcefile: 'main.cpp',
    libraries: validatedConfig.libraries || `${COMMON_LIBRARIES}`,
    additionalLibs: getAdditionalLibraries(compiler as string, standard as string, language)
  };

  // Determine output format
  const alwaysShowOutput = validatedConfig.alwaysShowCompilerOutput || false;

  const outputFormat = alwaysShowOutput ? OUTPUT_FORMATS.ALWAYS_SHOW : OUTPUT_FORMATS.DEFAULT;

  // Build the full command
  const commandParts = [
    components.compiler, components.langFlag, components.standard, components.stdlib, components.optimization,
    components.flags, components.sourcefile, components.libraries,
    components.additionalLibs
  ].filter(Boolean); // Remove empty parts

  let cmd = commandParts.join(' ') + ' ' + outputFormat;

  // Add extra commands if specified
  if (validatedConfig.extraCommands) {
    cmd += `; ${validatedConfig.extraCommands}`;
  }

  return cmd;
};

/**
 * Runs code through the Coliru service
 */
export const runOnColiru = async (code: string, language: SupportedLanguages, config: CppConfig | CConfig):
  Promise<CodeRunnerOutput> => {
  try {
    // Build the command based on the configuration
    const cmd = buildCommand(config, language);

    // Send to Coliru for execution
    const response = await fetch(packageJson.config.coliru.compileUrl, {
      method: 'POST',
      body: JSON.stringify({
        cmd,
        src: code + "\n",
      }),
      cache: 'default',
    });

    const result = await response.text();
    return {
      text: result,
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
