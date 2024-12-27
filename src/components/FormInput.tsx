import { JSX } from 'react';
import { useFormContext } from 'react-hook-form';

const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  constraints = {},
  iconEnd = null,
  onClickIconEnd = () => {},
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  constraints?: Record<string, unknown>;
  iconEnd?: JSX.Element | null;
  onClickIconEnd?: (() => void);
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <label htmlFor={name} className='flex text-ct-blue-600 mb-3'>
        {label}
      </label>
      <div className='flex'>
        <input
          type={type}
          placeholder={placeholder}
          className='w-full rounded-2xl appearance-none focus:outline-none py-2 px-4'
          {...register(name, constraints)}
        />
        {iconEnd && (
          <span className='flex items-center' onClick={onClickIconEnd}>
            <span className='-ml-10 absolute'>{iconEnd}</span>
          </span>
        )}
      </div>

      {errors[name] && (
        <span className='text-red-600 text-xs pt-1'>
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  );
};

export default FormInput;
