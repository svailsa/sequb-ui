# Type Safety Guide for Sequb UI

## Overview
This document outlines the comprehensive type safety measures implemented in Sequb UI to prevent runtime errors and ensure code correctness.

## 🛡️ Type Safety Features

### 1. **Maximum TypeScript Strictness**
All strict flags enabled in `tsconfig.json`:
- `strict: true` - Enables all strict type checking options
- `noUncheckedIndexedAccess: true` - Ensures array/object access is null-safe
- `exactOptionalPropertyTypes: true` - Prevents assigning undefined to optional properties
- `noImplicitOverride: true` - Requires explicit override keyword

### 2. **Branded Types** (`src/types/branded.ts`)
Prevent mixing up primitive types with same underlying representation:

```typescript
// Can't accidentally mix these up
const nodeId: NodeId = createNodeId("node-123")
const edgeId: EdgeId = createEdgeId("edge-456")

// This would be a compile error:
// const wrong: NodeId = edgeId // ❌ Type error!
```

Benefits:
- **Semantic clarity** - Types express intent
- **Compile-time safety** - Can't pass wrong ID type
- **Runtime validation** - Constructor functions validate format

### 3. **Runtime Validation with Zod**
All external data is validated at boundaries:

```typescript
// API responses are validated
const response = await api.registry.get()
const registry = RegistrySchema.parse(response.data) // Throws if invalid

// User inputs are validated
const nodeType = validateDragNodeType(event.dataTransfer.getData('...'))
if (!nodeType) return // Type narrowed to valid NodeType
```

### 4. **Discriminated Unions for State**
Exhaustive handling of all possible states:

```typescript
function handleStatus(status: ExecutionStatus) {
  switch (status.status) {
    case 'pending':
      return handlePending(status) // status narrowed to pending type
    case 'running':
      return handleRunning(status) // status has progress field
    case 'completed':
      return handleCompleted(status) // status has result field
    case 'failed':
      return handleFailed(status) // status has error field
    default:
      return assertNever(status) // Compile error if case missing
  }
}
```

### 5. **Type-Safe Store with Immer**
Immutable updates with type safety:

```typescript
const useGraphStore = create<GraphStore>()(
  immer((set, get) => ({
    addNode: (node) => {
      const validated = NodeSchema.parse(node) // Validate first
      set(state => {
        state.nodes.set(node.id, validated) // Type-safe mutation
      })
    }
  }))
)
```

### 6. **Type-Safe Tauri IPC**
Strongly typed communication with backend:

```typescript
// All commands have defined input/output types
const port = await invoke('get_server_port') // Returns Port type
const verified = await invoke('verify_binary_integrity', { 
  path: '/path/to/binary',
  hash: 'sha256hash'
}) // Returns boolean

// Type-safe event listeners
listen('server-ready', (port: Port) => {
  console.log(`Server ready on port ${port}`)
})
```

### 7. **Result Type for Error Handling**
Explicit error handling without exceptions:

```typescript
async function fetchData(): Promise<Result<Data, ApiError>> {
  try {
    const data = await api.getData()
    return Ok(data)
  } catch (error) {
    return Err(new ApiError(error))
  }
}

// Usage forces error handling
const result = await fetchData()
if (result.ok) {
  handleData(result.value) // Type narrowed to Data
} else {
  handleError(result.error) // Type narrowed to ApiError
}
```

## 📋 Type Safety Checklist

### When Adding New Features:
- [ ] Define types first, implement second
- [ ] Use branded types for identifiers
- [ ] Create Zod schemas for external data
- [ ] Add runtime validation at boundaries
- [ ] Use discriminated unions for state
- [ ] Handle all cases exhaustively
- [ ] Add type guards for narrowing
- [ ] Document complex types

### API Integration:
- [ ] Define request/response types
- [ ] Validate responses with Zod
- [ ] Handle errors with Result type
- [ ] Add rate limiting checks
- [ ] Sanitize user inputs

### Component Props:
- [ ] Define explicit prop types
- [ ] Use discriminated unions for variants
- [ ] Make optional props truly optional
- [ ] Validate props at runtime if needed

### Store Updates:
- [ ] Use Immer for immutable updates
- [ ] Validate data before storing
- [ ] Type action parameters strictly
- [ ] Use selectors for derived state

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Using `any` type
```typescript
// ❌ Bad
const processData = (data: any) => { ... }

// ✅ Good
const processData = (data: unknown) => {
  const validated = DataSchema.parse(data)
  // Now data is properly typed
}
```

### Pitfall 2: Unchecked array access
```typescript
// ❌ Bad
const first = array[0] // Could be undefined

// ✅ Good
const first = array[0]
if (!first) return // Type narrowed to defined
```

### Pitfall 3: Missing error handling
```typescript
// ❌ Bad
const data = await api.getData() // Could throw

// ✅ Good
const result = await tryCatch(() => api.getData())
if (!result.ok) {
  handleError(result.error)
  return
}
```

### Pitfall 4: Implicit type assertions
```typescript
// ❌ Bad
const id = value as NodeId // Unsafe cast

// ✅ Good
const id = createNodeId(value) // Validated constructor
// Or with type guard
if (isNodeId(value)) {
  // value is NodeId here
}
```

## 🧪 Testing Type Safety

### Unit Tests for Type Guards:
```typescript
describe('Type Guards', () => {
  it('should validate NodeId', () => {
    expect(isNodeId('valid-id')).toBe(true)
    expect(isNodeId('')).toBe(false)
    expect(isNodeId(123)).toBe(false)
  })
})
```

### Integration Tests with Schemas:
```typescript
describe('API Schemas', () => {
  it('should validate registry response', () => {
    const valid = { version: '1.0', categories: [], nodes: {} }
    expect(() => RegistrySchema.parse(valid)).not.toThrow()
    
    const invalid = { version: 123 } // Wrong type
    expect(() => RegistrySchema.parse(invalid)).toThrow()
  })
})
```

## 🔧 Tooling Configuration

### VSCode Settings:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.includeInlayParameterNameHints": "all",
  "typescript.preferences.includeInlayFunctionParameterTypeHints": true
}
```

### Pre-commit Hooks:
```bash
# Run type checking
npm run type-check

# Run ESLint with type-aware rules
npm run lint

# Run tests with type coverage
npm run test:types
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev/)
- [Type-Safe React Patterns](https://react-typescript-cheatsheet.netlify.app/)
- [Branded Types Pattern](https://egghead.io/blog/using-branded-types-in-typescript)

## 🎯 Benefits Achieved

1. **Zero Runtime Type Errors** - All types validated at compile time and runtime boundaries
2. **Self-Documenting Code** - Types serve as inline documentation
3. **Refactoring Safety** - Changes propagate through type system
4. **Better IDE Support** - Autocomplete and inline errors
5. **Reduced Debugging Time** - Errors caught at compile time
6. **Team Productivity** - Clear contracts between components

Remember: **If it compiles, it works!** (mostly 😊)