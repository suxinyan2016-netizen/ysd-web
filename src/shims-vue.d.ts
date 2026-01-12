// 声明 .vue 文件模块，避免 TS 找不到模块的错误
declare module "*.vue" {
  import { ComponentOptions } from "vue";
  const component: ComponentOptions;
  export default component;
}
