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
  onClickIconEnd?: () => void;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Display error messages based on the type of error
  let errorBlock = null;
  if (errors[name]) {
    if (errors[name]?.type === 'validate') {
      const errorMessage = errors[name]?.message as string || '';
      const errorMessages = errorMessage.split('\n').filter((msg) => msg) || [];

      errorBlock = (
        <div className='grid grid-cols-1 w-full pt-1'>
          {errorMessages.map((msg, index) => {
            const key = `error-${name}-${index}`;
            return (
              // Each error is a row in the grid
              <div key={key} className='text-red-600 text-xs'>
                {msg}
              </div>
            );
          })}
        </div>
      );
    } else {
      errorBlock = (
        <span className='text-red-600 text-xs pt-1'>
          {errors[name]?.message as string}
        </span>
      );
    }
  }

  return (
    <div>
      <label htmlFor={name} className='flex text-ct-blue-600 mb-3'>
        {label}
      </label>
      <div className='flex'>
        <input
          type={type}
          placeholder={placeholder}
          className='input w-full rounded-2xl appearance-none focus:outline-hidden py-2 px-4'
          {...register(name, constraints)}
        />
        {iconEnd && (
          <span className='flex items-center' onClick={onClickIconEnd}>
            <span className='-ml-10 absolute'>{iconEnd}</span>
          </span>
        )}
      </div>

      {errorBlock}
    </div>
  );
};

export default FormInput;
