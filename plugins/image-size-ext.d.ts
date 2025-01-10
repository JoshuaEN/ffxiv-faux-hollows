declare module "*.webp?metadata" {
  const metadata: { height: number; width: number };
  export default metadata;
}
