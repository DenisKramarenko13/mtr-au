'use client';

import { memo, useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import selectS from './select.module.scss';

interface SelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

function Select({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  label,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронизируем внутренний инпут с внешним value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Фильтруем options по введенному тексту
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleBlur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, options, value]);

  // Валидация при завершении ввода (blur)
  const handleBlur = () => {
    setIsOpen(false);
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      onChange('');
      setInputValue('');
      return;
    }

    // Ищем точное совпадение (без учета регистра)
    const matched = options.find(
      (option) => option.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      onChange(matched);
      setInputValue(matched);
    } else {
      // Если не совпало ни с одним из option — откатываем к предыдущему валидному значение
      setInputValue(value);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setInputValue(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value);
    }
  };

  return (
    <div className={selectS.wrapper} ref={containerRef}>
      {label && <label className={selectS.label}>{label}</label>}
      
      <div className={selectS.inputContainer}>
        <input
          type="text"
          className={selectS.input}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          className={`${selectS.chevron} ${isOpen ? selectS.chevronOpen : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          tabIndex={-1}
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <ul className={selectS.dropdown}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option}
                className={`${selectS.option} ${
                  index === highlightedIndex ? selectS.optionActive : ''
                } ${option === value ? selectS.optionSelected : ''}`}
                onMouseDown={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </li>
            ))
          ) : (
            <li className={selectS.noOptions}>Ничего не найдено</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default memo(Select);
