---
theme: default
layout: two-cols-header
class: p-2

# C configuration using default settings
c:
  # Compiler to use.
  compiler: 'gcc'

  # C standard.
  standard: 'c2x'

  # Optimization level.
  optimization: 'O2'

  # Compiler flags.
  flags: '-Wall -Wextra -pedantic -pthread -pedantic-errors'

  # Libraries to link.
  libraries: '-lm -latomic'

  # Additional shell commands to run after compilation.
  extraCommands: ''

  # Whether to always show the compiler output.
  alwaysShowCompilerOutput: true

# C++ configuration using default settings
cpp:
  # Compiler to use.
  compiler: 'g++'

  # C++ standard.
  standard: 'c++20'

  # Optimization level.
  optimization: 'O2'

  # Compiler flags.
  flags: '-Wall -Wextra -pedantic -pthread -pedantic-errors'

  # Libraries to link.
  libraries: '-lm -latomic'

  # Additional shell commands to run after compilation.
  extraCommands: ''

  # Whether to always show the compiler output.
  alwaysShowCompilerOutput: false

---

# C + C++ Runner for [Slidev]

Powered by [Coliru]

::left::

# C

```c {monaco-run}
#include <stdio.h>

int main( void )
{
  const char *vec[] = { "GCC", __VERSION__ };
  int n = sizeof ( vec ) / sizeof ( vec[0] );

  for ( int i = 0; i < n; ++i ) {
    printf( "%s ", vec[i] );
  }

  printf ( "\n" );
  return 0;
}

```

::right::

# C++

```cpp {monaco-run} {banana}
#include <iostream>

int main()
{
    const char* vec[] = { "GCC", __VERSION__ };

    for ( const auto & str : vec )
    {
        std::cout << str << ' ';
    }

    std::cout << '\n';
    return 0;
}

```

[//]: (Externals)
[Slidev]: https://sli.dev
[Coliru]: https://coliru.stacked-crooked.com
[//]: (EOF)
