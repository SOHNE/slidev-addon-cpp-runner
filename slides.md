---
theme: default
layout: two-cols-header
class: p-2
---

# C + C++ Runner for [Slidev]

Powered by [Coliru]

::left::

# C

```c {monaco-run}
#include <stdio.h>

int main( void )
{
  char *vec[] = { "GCC", __VERSION__ };
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

```cpp {monaco-run}
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
