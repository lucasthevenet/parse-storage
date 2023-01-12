# parse-storage
Use parsers to validate your local/session storage

## Usage
Create an object mapping every key to appear in localStorage to a Zod schema:
```tsx
import { useLocalStorage } from 'storage-validator'

// Usage
export default function Component() {
  const [isDarkTheme, setDarkTheme] = useLocalStorage('darkTheme', true, {
    schema: z.boolean(),
  })

  const toggleTheme = () => {
    setDarkTheme((prevValue: boolean) => !prevValue)
  }

  return (
    <button onClick={toggleTheme}>
      {`The current theme is ${isDarkTheme ? `dark` : `light`}`}
    </button>
  )
}
```