import type SwalType from "sweetalert2";
import type TomSelectType from "tom-select";

declare global {
  namespace Swal {
    export = SwalType;
  }
  const TomSelect: typeof TomSelectType;
}

export {};
