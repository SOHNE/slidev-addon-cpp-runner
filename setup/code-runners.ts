import { useNav } from '@slidev/client';
import { CodeRunnerContext, CodeRunnerOutput, CodeRunnerProviders, defineCodeRunnersSetup } from '@slidev/types';
import { ref } from 'vue';

import { BackendId, defaultCConfig, defaultCppConfig, SlideFrontmatter, SupportedLanguages, validateConfig } from './backends/config';
import { runOnColiru } from './backends/coliru';
import { runOnGodbolt } from './backends/godbolt';

// Available execution backends
const BACKENDS: Record<BackendId, (code: string, language: SupportedLanguages, config: any) => Promise<CodeRunnerOutput>> = {
  godbolt: runOnGodbolt,
  coliru: runOnColiru
};

// Warn only once per session when extraCommands is dropped by backends without a shell
let warnedExtraCommands = false;

/**
 * Gets frontmatter configuration for the current slide
 */
const getSlideConfig = (language: SupportedLanguages): SlideFrontmatter => {
  const { currentPage, slides } = useNav();
  const pageIndex = currentPage.value;

  // Get the current slide data
  if (pageIndex === undefined || !slides.value || slides.value.length === 0) {
    return {};
  }

  // Find the slide for the current page
  const slide = slides.value.find(slide => slide.no === pageIndex);
  if (!slide || !slide.meta.slide) {
    return {};
  }

  // Access language-specific frontmatter from the slide ( slide-level keys merge below the language block )
  const frontmatter = slide.meta.slide.frontmatter || {};
  return { ...frontmatter, ...(frontmatter?.[language] || {}) };
};

// A reactive flag that tracks whether code is currently running
const isRunning = ref(false);

/**
 * Runs code through the backend selected in the slide frontmatter ( default: godbolt )
 */
const runCode = async (code: string, language: SupportedLanguages): Promise<CodeRunnerOutput> => {
  try {
    // Set the reactive flag to true before starting execution
    isRunning.value = true;

    // Get configuration from slide frontmatter or use defaults
    const slideConfig = getSlideConfig(language);
    const baseConfig = language === 'cpp' ? defaultCppConfig : defaultCConfig;
    const config = { ...baseConfig, ...slideConfig };

    // Validate and resolve the backend ( slide-level override, then per-language, then default )
    const validatedConfig = validateConfig(config, language);
    const backendId = validatedConfig.backend || 'godbolt';

    // extraCommands are shell-only and unsupported by backends without a shell
    if (backendId === 'godbolt' && validatedConfig.extraCommands && !warnedExtraCommands) {
      console.warn(`'extraCommands' is not supported by the godbolt backend and will be ignored`);
      warnedExtraCommands = true;
    }

    console.log(`Running ${language} with config:`, validatedConfig);

    // Send to the selected backend for execution
    return await BACKENDS[backendId](code, language, validatedConfig);
  }
  catch (error) {
    return {
      text: error instanceof Error ? error.message : String(error),
      class: 'text-red',
    };
  }
  finally {
    // Reset the reactive flag after execution finishes
    isRunning.value = false;
  }
};

export default defineCodeRunnersSetup((_runners: CodeRunnerProviders) => {
  return {
    c: async (code: string, _ctx: CodeRunnerContext): Promise<CodeRunnerOutput> => runCode(code, 'c'),
    cpp: async (code: string, _ctx: CodeRunnerContext): Promise<CodeRunnerOutput> => runCode(code, 'cpp'),
  };
});
