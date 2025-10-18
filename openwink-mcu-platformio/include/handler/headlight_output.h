#ifndef __HEADLIGHT_OUTPUT
#define __HEADLIGHT_OUTPUT

class HeadlightOutputHandler
{
  private:
    static struct HeadlightStatus
    {
        static int left;
        static int right;
    } headlight_status;

  public:
    static void init()
    {
        HeadlightStatus::left = 0;
        HeadlightStatus::right = 0;
    }

    static HeadlightStatus getStatus()
    {
        return headlight_status;
    };
    static void setLeft(int left)
    {
        HeadlightStatus::left = left;
    };
    static void setRight(int right)
    {
        HeadlightStatus::right = right;
    };
};

#endif