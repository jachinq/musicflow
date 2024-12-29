interface Props {
  title: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  children: React.ReactNode;
}
export const Form = ({ title, children, onSubmit, onCancel }: Props) => {
  return (
    <>
      <div className="mask" onClick={onCancel}></div>
      <div className="dialog flex flex-col gap-2 z-20 p-8">
        <div className="text-lg font-bold">{title}</div>

        {children && <div className="form-content">{children}</div>}

        <div className="flex justify-end gap-2 items-center mt-4">
          <button onClick={onSubmit} className="button">
            提交
          </button>
          <button onClick={onCancel} className="button-info">
            取消
          </button>
        </div>
      </div>
    </>
  );
};
