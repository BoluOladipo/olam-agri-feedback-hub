import { ReactNode } from "react";

interface ProductSectionProps {
  productName: string;
  children: ReactNode;
}

export const ProductSection = ({ productName, children }: ProductSectionProps) => {
  return (
    <section className="py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h2 className="product-title">{productName}</h2>
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
};
