// Workaroung to bypass TypeScript build time check.
//
// repeat supports from ES6

interface String {
    repeat(count: number): string;
    padStart(targetLength: number, padString: string): string;
}