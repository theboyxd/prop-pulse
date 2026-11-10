import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SIDEBAR_STYLE_ID = "wensity-sidebar-styles";
const SIDEBAR_CSS = `
/* ── Sidebar nav: idle-hidden, visible while scrolling ─────── */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
  transition: background-color 0.45s ease;
}
.sidebar-nav.is-scrolling {
  scrollbar-color: rgba(255, 255, 255, 0.11) transparent;
}
.sidebar-nav.is-scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.11);
}
`;

if (typeof document !== "undefined" && !document.getElementById(SIDEBAR_STYLE_ID)) {
  const styleEl = document.createElement("style");
  styleEl.id = SIDEBAR_STYLE_ID;
  styleEl.textContent = SIDEBAR_CSS;
  document.head.appendChild(styleEl);
}

export type SidebarVariant = "default" | "collapsible" | "icon-rail" | "resizable" | "floating";

interface SidebarContextValue {
  variant: SidebarVariant;
  collapsed: boolean;
  toggleCollapsed: () => void;
  navId: string;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("Sidebar compound components must be used within <Sidebar>");
  }
  return ctx;
}

export function useSidebar() {
  const { variant, collapsed, toggleCollapsed } = useSidebarContext();
  return { variant, collapsed, toggleCollapsed };
}

function useResizableWidth(initialWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const clamp = useCallback(
    (val: number) => Math.min(maxWidth, Math.max(minWidth, val)),
    [minWidth, maxWidth]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startWidth: width };
      setIsDragging(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      setWidth(clamp(dragRef.current.startWidth + delta));
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, clamp]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 48 : 16;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setWidth((w) => clamp(w - step));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setWidth((w) => clamp(w + step));
      } else if (e.key === "Home") {
        e.preventDefault();
        setWidth(minWidth);
      } else if (e.key === "End") {
        e.preventDefault();
        setWidth(maxWidth);
      }
    },
    [clamp, minWidth, maxWidth]
  );

  const reset = useCallback(() => setWidth(initialWidth), [initialWidth]);

  return { width, isDragging, onPointerDown, onKeyDown, reset };
}

const ITEM_BASE_CLASSES = cn(
  "group/sidebar-item relative flex w-full items-center gap-2.5 rounded-[var(--primitive-radius-item,0.625rem)] px-3 py-[7px]",
  "text-[13.5px] font-medium leading-none outline-none select-none whitespace-nowrap",
  "transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  "disabled:pointer-events-none disabled:opacity-40"
);

const ITEM_INACTIVE_CLASSES = cn(
  "text-[color:var(--primitive-text-secondary,color-mix(in_srgb,var(--foreground)_72%,transparent))]",
  "hover:text-[var(--foreground)]",
  "hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]"
);

const ITEM_ACTIVE_CLASSES = "text-[var(--foreground)]";

const ACTIVE_PILL_CLASSES = cn(
  "pointer-events-none absolute inset-0 rounded-[var(--primitive-radius-item,0.625rem)]",
  "bg-[color:var(--primitive-surface-selected,color-mix(in_srgb,var(--foreground)_7%,transparent))]",
  "transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
);

function LayoutSidebarLeftExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
      <path d="M9 4v16" />
      <path d="M14 10l2 2l-2 2" />
    </svg>
  );
}

function LayoutSidebarLeftCollapseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
      <path d="M9 4v16" />
      <path d="M15 10l-2 2l2 2" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  variant?: SidebarVariant;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: number;
  collapsedWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      variant = "default",
      collapsed: controlledCollapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      width = 260,
      collapsedWidth = 60,
      minWidth = 180,
      maxWidth = 400,
      className,
      children,
      "aria-label": ariaLabel = "Sidebar",
      style,
      ...rest
    },
    ref
  ) => {
    const uid = useId();
    const isCollapsible = variant === "collapsible";
    const isIconRail = variant === "icon-rail";
    const isResizable = variant === "resizable";

    const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
    const isControlled = controlledCollapsed !== undefined;
    const collapsed = isIconRail
      ? true
      : isCollapsible
      ? isControlled
        ? controlledCollapsed
        : uncontrolledCollapsed
      : false;

    const toggleCollapsed = useCallback(() => {
      if (!isCollapsible) return;
      const next = !collapsed;
      if (!isControlled) {
        setUncontrolledCollapsed(next);
      }
      onCollapsedChange?.(next);
    }, [isCollapsible, collapsed, isControlled, onCollapsedChange]);

    const resizable = useResizableWidth(width, minWidth, maxWidth);
    const computedWidth = collapsed
      ? collapsedWidth
      : isResizable
      ? resizable.width
      : width;

    const contextValue = useMemo<SidebarContextValue>(
      () => ({
        variant,
        collapsed,
        toggleCollapsed,
        navId: `sidebar-${uid}`,
      }),
      [variant, collapsed, toggleCollapsed, uid]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <nav
          data-wensity-primitive=""
          ref={ref}
          aria-label={ariaLabel}
          data-slot="sidebar"
          data-variant={variant}
          data-collapsed={collapsed ? "true" : "false"}
          data-dragging={resizable.isDragging ? "true" : undefined}
          style={{
            ...style,
            width: computedWidth,
            flexShrink: 0,
            transition: resizable.isDragging
              ? "none"
              : "width 240ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          className={cn(
            "relative isolate flex flex-col overflow-hidden",
            "bg-[var(--background)] text-[var(--foreground)]",
            variant === "floating"
              ? cn(
                  "m-3 h-[calc(100%-1.5rem)] rounded-[var(--primitive-radius-surface,1rem)]",
                  "border border-[var(--border)]",
                  "bg-[color:var(--primitive-surface-elevated,var(--card))]",
                  "[box-shadow:var(--primitive-shadow-raised,0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.12))]"
                )
              : "border-r border-[var(--border)]",
            resizable.isDragging && "select-none",
            className
          )}
          {...rest}
        >
          {children}
          {isResizable && (
            <div
              role="separator"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              aria-valuemin={minWidth}
              aria-valuemax={maxWidth}
              aria-valuenow={Math.round(resizable.width)}
              data-slot="sidebar-resize-handle"
              onPointerDown={resizable.onPointerDown}
              onKeyDown={resizable.onKeyDown}
              onDoubleClick={resizable.reset}
              className={cn(
                "absolute inset-y-0 right-0 z-20 w-1.5 cursor-col-resize outline-none",
                "after:absolute after:inset-y-0 after:right-0 after:w-[2px]",
                "after:bg-transparent after:transition-colors after:duration-150",
                "hover:after:bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]",
                "focus-visible:after:bg-[color-mix(in_srgb,var(--foreground)_25%,transparent)]",
                resizable.isDragging &&
                  "after:bg-[color-mix(in_srgb,var(--foreground)_30%,transparent)]"
              )}
            />
          )}
        </nav>
      </SidebarContext.Provider>
    );
  }
);
Sidebar.displayName = "Sidebar";

function FadingLabel({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return <span className={className}>{children}</span>;
}

export interface SidebarToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  collapsed?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode);
}

export const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ className, children, collapsed: propCollapsed, onToggle, ...rest }, ref) => {
    const ctx = useContext(SidebarContext);
    const isCollapsible = ctx?.variant === "collapsible";
    const collapsed = isCollapsible ? ctx.collapsed : propCollapsed;
    const handleToggle = isCollapsible ? ctx.toggleCollapsed : onToggle;

    if (collapsed === undefined || !handleToggle) return null;

    return (
      <button
        ref={ref}
        type="button"
        data-slot="sidebar-toggle"
        data-collapsed={collapsed ? "true" : "false"}
        onClick={handleToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)] outline-none",
          "text-[var(--muted-foreground)]",
          "hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
          "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          "[transition:transform_120ms_cubic-bezier(0.23,1,0.32,1),color_150ms_ease,background-color_150ms_ease]",
          "active:[transform:scale(0.96)]",
          className
        )}
        {...rest}
      >
        {typeof children === "function"
          ? children({ collapsed })
          : children ??
            (collapsed ? (
              <LayoutSidebarLeftExpandIcon className="size-[17px]" />
            ) : (
              <LayoutSidebarLeftCollapseIcon className="size-[17px]" />
            ))}
      </button>
    );
  }
);
SidebarToggle.displayName = "SidebarToggle";

export const SidebarHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onClick, ...rest }, ref) => {
  const { collapsed, variant, toggleCollapsed } = useSidebarContext();
  const isCollapsible = variant === "collapsible";

  const filteredChildren = collapsed
    ? React.Children.toArray(children).filter(
        (child) => !(React.isValidElement(child) && child.type === SidebarToggle)
      )
    : children;

  return (
    <div
      ref={ref}
      data-slot="sidebar-header"
      data-collapsed={collapsed ? "true" : "false"}
      role={collapsed && isCollapsible ? "button" : undefined}
      tabIndex={collapsed && isCollapsible ? 0 : undefined}
      aria-label={collapsed && isCollapsible ? "Expand sidebar" : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (collapsed && isCollapsible) {
          toggleCollapsed();
        }
      }}
      onKeyDown={(e) => {
        if (collapsed && isCollapsible && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggleCollapsed();
        }
      }}
      className={cn(
        "flex shrink-0 items-center",
        collapsed
          ? cn(
              "flex-col justify-center gap-2 px-0 py-3",
              isCollapsible &&
                cn(
                  "cursor-pointer select-none outline-none rounded-[var(--primitive-radius-item,0.625rem)]",
                  "[transition:background-color_150ms_cubic-bezier(0.23,1,0.32,1),transform_120ms_cubic-bezier(0.23,1,0.32,1)]",
                  "hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                  "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  "active:[transform:scale(0.97)]"
                )
            )
          : "h-[52px] gap-2.5 px-[18px]",
        className
      )}
      {...rest}
    >
      {filteredChildren}
    </div>
  );
});
SidebarHeader.displayName = "SidebarHeader";

export const SidebarNav = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...rest }, ref) => {
  const { navId } = useSidebarContext();
  return (
    <div
      ref={ref}
      id={navId}
      data-slot="sidebar-nav"
      className={cn(
        "sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain py-2",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
SidebarNav.displayName = "SidebarNav";

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, label, children, ...rest }, ref) => {
    const { collapsed } = useSidebarContext();
    return (
      <div
        ref={ref}
        data-slot="sidebar-section"
        role="group"
        aria-label={label}
        className={cn("py-1", className)}
        {...rest}
      >
        {label && (
          <div className="flex h-[26px] items-end px-[18px] pb-1.5">
            <FadingLabel
              show={!collapsed}
              className={cn(
                "text-[10.5px] font-medium uppercase leading-none tracking-[0.08em]",
                "text-[var(--muted-foreground)] whitespace-nowrap"
              )}
            >
              {label}
            </FadingLabel>
          </div>
        )}
        <div className="flex flex-col gap-px px-2">{children}</div>
      </div>
    );
  }
);
SidebarSection.displayName = "SidebarSection";

export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  active?: boolean;
  href?: string;
  external?: boolean;
  badge?: React.ReactNode;
}

export const SidebarItem = forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    {
      className,
      icon,
      active = false,
      href,
      external = false,
      badge,
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    const { collapsed } = useSidebarContext();
    const itemClasses = cn(
      ITEM_BASE_CLASSES,
      active ? ITEM_ACTIVE_CLASSES : ITEM_INACTIVE_CLASSES,
      collapsed && "justify-center px-0",
      className
    );
    const titleTooltip =
      collapsed && typeof children === "string" ? children : undefined;

    const content = (
      <>
        {active ? (
          <span aria-hidden="true" className={ACTIVE_PILL_CLASSES} />
        ) : null}
        {icon ? (
          <span
            data-slot="sidebar-item-icon"
            className={cn(
              "relative z-10 flex size-5 shrink-0 items-center justify-center",
              active
                ? "text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] transition-colors duration-150 group-hover/sidebar-item:text-[var(--foreground)]"
            )}
          >
            {icon}
          </span>
        ) : null}
        <FadingLabel
          show={!collapsed}
          className="relative z-10 min-w-0 flex-1 truncate text-left"
        >
          {children}
        </FadingLabel>
        {badge ? (
          <FadingLabel
            show={!collapsed}
            className="relative z-10 flex shrink-0 items-center"
          >
            {badge}
          </FadingLabel>
        ) : null}
      </>
    );

    if (href) {
      return (
        <a
          data-slot="sidebar-item"
          data-active={active ? "true" : undefined}
          aria-current={active ? "page" : undefined}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          title={titleTooltip}
          className={itemClasses}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        data-slot="sidebar-item"
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        disabled={disabled}
        title={titleTooltip}
        className={itemClasses}
        {...rest}
      >
        {content}
      </button>
    );
  }
);
SidebarItem.displayName = "SidebarItem";

export interface SidebarNestedProps {
  icon?: React.ReactNode;
  label: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  active?: boolean;
  children: React.ReactNode;
}

export const SidebarNested = forwardRef<HTMLDivElement, SidebarNestedProps>(
  (
    {
      icon,
      label,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      active = false,
      children,
    },
    ref
  ) => {
    const { collapsed } = useSidebarContext();
    const uid = useId();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const handleToggle = useCallback(() => {
      const next = !isOpen;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [isOpen, isControlled, onOpenChange]);

    const contentId = `sidebar-nested-content-${uid}`;

    return (
      <div ref={ref} data-slot="sidebar-nested" className="flex flex-col">
        <button
          type="button"
          data-slot="sidebar-nested-trigger"
          data-open={isOpen ? "true" : "false"}
          data-active={active ? "true" : undefined}
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={handleToggle}
          title={collapsed ? label : undefined}
          className={cn(
            ITEM_BASE_CLASSES,
            active && collapsed ? ITEM_ACTIVE_CLASSES : ITEM_INACTIVE_CLASSES,
            collapsed && "justify-center px-0"
          )}
        >
          {active && collapsed && (
            <span aria-hidden="true" className={ACTIVE_PILL_CLASSES} />
          )}
          {icon && (
            <span
              data-slot="sidebar-nested-icon"
              className="relative z-10 flex size-5 shrink-0 items-center justify-center text-[var(--muted-foreground)] group-hover/sidebar-item:text-[var(--foreground)] transition-colors duration-150"
            >
              {icon}
            </span>
          )}
          <FadingLabel
            show={!collapsed}
            className="relative z-10 min-w-0 flex-1 truncate text-left"
          >
            {label}
          </FadingLabel>
          <FadingLabel
            show={!collapsed}
            className="relative z-10 flex shrink-0 items-center"
          >
            <span
              aria-hidden="true"
              className="flex items-center justify-center text-[var(--muted-foreground)] transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <ChevronRightIcon className="size-3.5" />
            </span>
          </FadingLabel>
        </button>
        {isOpen && !collapsed && (
          <div
            id={contentId}
            data-slot="sidebar-nested-content"
            className="overflow-hidden"
          >
            <div
              className={cn(
                "relative ml-[21px] flex flex-col gap-px py-0.5 pl-2.5",
                "before:absolute before:inset-y-1 before:left-0 before:w-px",
                "before:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
              )}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
);
SidebarNested.displayName = "SidebarNested";

export const SidebarFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...rest }, ref) => {
  const { collapsed } = useSidebarContext();
  return (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex shrink-0 items-center py-3",
        "border-t border-[var(--border)]",
        collapsed ? "justify-center px-0" : "gap-2.5 px-[18px]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
SidebarFooter.displayName = "SidebarFooter";

export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-[var(--muted-foreground)] tabular-nums">
      {children}
    </span>
  );
}
