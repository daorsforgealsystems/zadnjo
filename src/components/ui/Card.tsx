import UiCardDefault, { Card as ShadCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

// Tests expect a named export `UiCard` and default export
export const UiCard = UiCardDefault
export default UiCard

// Also export shadcn variants for consumers
export { ShadCard as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
