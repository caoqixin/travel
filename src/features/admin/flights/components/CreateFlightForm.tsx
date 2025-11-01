"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useDelayedImageUpload } from "@/hooks/useDelayedImageUpload";

const flightSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  type: z.enum(["one-way", "round-trip"]),
  image: z.string().optional(),
  price: z.number().min(0, "价格必须大于0"),

  // 航班信息
  flightNumber: z.string().min(1, "航班号不能为空"),
  flightDuration: z.string().min(1, "飞行时间不能为空"),

  departure: z.object({
    city: z.string().min(1, "出发城市不能为空"),
    airport: z.string().min(1, "出发机场不能为空"),
    code: z.string().min(1, "机场代码不能为空"),
    terminal: z.string().min(1, "候机楼不能为空"),
    time: z.string().min(1, "出发时间不能为空"),
  }),
  arrival: z.object({
    city: z.string().min(1, "到达城市不能为空"),
    airport: z.string().min(1, "到达机场不能为空"),
    code: z.string().min(1, "机场代码不能为空"),
    terminal: z.string().min(1, "候机楼不能为空"),
    time: z.string().min(1, "到达时间不能为空"),
  }),

  layovers: z
    .array(
      z.object({
        city: z.string().min(1, "中转城市不能为空"),
        airport: z.string().min(1, "中转机场不能为空"),
        code: z.string().min(1, "机场代码不能为空"),
        terminal: z.string().min(1, "候机楼不能为空"),
        flightNumber: z.string().min(1, "航班号不能为空"),
        duration: z.string().min(1, "中转时长不能为空"),
      })
    )
    .optional(),

  // 返程信息（仅往返航班）
  returnFlight: z
    .object({
      flightNumber: z.string().min(1, "返程航班号不能为空"),
      flightDuration: z.string().min(1, "返程飞行时间不能为空"),
      departure: z.object({
        city: z.string().min(1, "返程出发城市不能为空"),
        airport: z.string().min(1, "返程出发机场不能为空"),
        code: z.string().min(1, "返程机场代码不能为空"),
        terminal: z.string().min(1, "返程候机楼不能为空"),
        time: z.string().min(1, "返程出发时间不能为空"),
      }),
      arrival: z.object({
        city: z.string().min(1, "返程到达城市不能为空"),
        airport: z.string().min(1, "返程到达机场不能为空"),
        code: z.string().min(1, "返程机场代码不能为空"),
        terminal: z.string().min(1, "返程候机楼不能为空"),
        time: z.string().min(1, "返程到达时间不能为空"),
      }),
      layovers: z
        .array(
          z.object({
            city: z.string().min(1, "返程中转城市不能为空"),
            airport: z.string().min(1, "返程中转机场不能为空"),
            code: z.string().min(1, "返程机场代码不能为空"),
            terminal: z.string().min(1, "返程候机楼不能为空"),
            flightNumber: z.string().min(1, "返程航班号不能为空"),
            duration: z.string().min(1, "返程中转时长不能为空"),
          })
        )
        .optional(),
    })
    .optional(),

  airline: z.object({
    name: z.string().min(1, "航空公司名称不能为空"),
    code: z.string().min(1, "航空公司代码不能为空"),
  }),

  baggage: z.object({
    cabin: z.object({
      weight: z.string().min(1, "手提行李重量不能为空"),
      quantity: z.number().min(0, "手提行李数量不能小于0"),
    }),
    checked: z.object({
      weight: z.string().min(1, "托运行李重量不能为空"),
      quantity: z.number().min(0, "托运行李数量不能小于0"),
    }),
  }),

  amenities: z.array(z.string()).optional(),
  status: z.enum(["active", "sold-out", "inactive"]),
  tags: z.array(z.string()).optional(),
});

type FlightFormData = z.infer<typeof flightSchema>;

interface CreateFlightFormProps {
  onSubmit: (data: FlightFormData) => void;
  isLoading?: boolean;
}

export function CreateFlightForm({
  onSubmit,
  isLoading = false,
}: CreateFlightFormProps) {
  const [newAmenity, setNewAmenity] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const { uploading: imageUploading, uploadImageFile } =
    useDelayedImageUpload();

  const form = useForm<FlightFormData>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "one-way",
      image: "",
      price: 0,
      flightNumber: "",
      flightDuration: "",
      departure: {
        city: "",
        airport: "",
        code: "",
        terminal: "",
        time: "",
      },
      arrival: {
        city: "",
        airport: "",
        code: "",
        terminal: "",
        time: "",
      },
      layovers: [],
      returnFlight: undefined,
      airline: {
        name: "",
        code: "",
      },
      baggage: {
        cabin: {
          weight: "",
          quantity: 1,
        },
        checked: {
          weight: "",
          quantity: 1,
        },
      },
      amenities: [],
      status: "active",
      tags: [],
    },
  });

  const {
    fields: layoverFields,
    append: appendLayover,
    remove: removeLayover,
  } = useFieldArray({
    control: form.control,
    name: "layovers",
  });

  const {
    fields: returnLayoverFields,
    append: appendReturnLayover,
    remove: removeReturnLayover,
  } = useFieldArray({
    control: form.control,
    name: "returnFlight.layovers",
  });

  // 使用简单的状态管理来处理 amenities 和 tags
  const [amenities, setAmenities] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // 监听航班类型变化
  const watchType = form.watch("type");

  // 当航班类型改变时，处理返程信息
  useEffect(() => {
    if (watchType === "one-way") {
      form.setValue("returnFlight", undefined);
    } else if (watchType === "round-trip" && !form.getValues("returnFlight")) {
      form.setValue("returnFlight", {
        flightNumber: "",
        flightDuration: "",
        departure: {
          city: "",
          airport: "",
          code: "",
          terminal: "",
          time: "",
        },
        arrival: {
          city: "",
          airport: "",
          code: "",
          terminal: "",
          time: "",
        },
        layovers: [],
      });
    }
  }, [watchType, form]);

  const addAmenity = () => {
    if (newAmenity.trim()) {
      const newAmenities = [...amenities, newAmenity.trim()];
      setAmenities(newAmenities);
      form.setValue("amenities", newAmenities);
      setNewAmenity("");
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setNewTag("");
    }
  };

  const removeAmenity = (index: number) => {
    const newAmenities = amenities.filter((_, i) => i !== index);
    setAmenities(newAmenities);
    form.setValue("amenities", newAmenities);
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  // 处理表单提交，包括图片上传
  const handleFormSubmit = async (data: FlightFormData) => {
    const finalData = { ...data };

    // 如果有选择的图片文件，先上传图片
    if (selectedImageFile) {
      const uploadResult = await uploadImageFile(selectedImageFile);
      if (uploadResult?.url) {
        finalData.image = uploadResult.url;
      } else {
        // 图片上传失败，不继续提交表单
        return;
      }
    }

    // 调用原始的 onSubmit 函数
    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航班标题</FormLabel>
                  <FormControl>
                    <Input placeholder="输入航班标题" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航班描述（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="输入航班描述" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航班类型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择航班类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="one-way">单程</SelectItem>
                      <SelectItem value="round-trip">往返</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航班图片</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isLoading || imageUploading}
                      previewMode={true}
                      onFileSelect={(file) => setSelectedImageFile(file)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 价格信息 */}
        <Card>
          <CardHeader>
            <CardTitle>价格信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>价格 (€)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 航班信息 */}
        <Card>
          <CardHeader>
            <CardTitle>航班信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 航班号和飞行时间 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flightNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>航班号</FormLabel>
                    <FormControl>
                      <Input placeholder="CA1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flightDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>飞行时间</FormLabel>
                    <FormControl>
                      <Input placeholder="2小时30分钟" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 出发信息 */}
            <div className="space-y-4">
              <h4 className="font-medium">出发信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departure.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出发城市</FormLabel>
                      <FormControl>
                        <Input placeholder="北京" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departure.airport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出发机场</FormLabel>
                      <FormControl>
                        <Input placeholder="首都国际机场" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departure.code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>机场代码</FormLabel>
                      <FormControl>
                        <Input placeholder="PEK" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departure.terminal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>候机楼</FormLabel>
                      <FormControl>
                        <Input placeholder="T3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departure.time"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>出发时间</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* 到达信息 */}
            <div className="space-y-4">
              <h4 className="font-medium">到达信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="arrival.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>到达城市</FormLabel>
                      <FormControl>
                        <Input placeholder="上海" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival.airport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>到达机场</FormLabel>
                      <FormControl>
                        <Input placeholder="浦东国际机场" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival.code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>机场代码</FormLabel>
                      <FormControl>
                        <Input placeholder="PVG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival.terminal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>候机楼</FormLabel>
                      <FormControl>
                        <Input placeholder="T2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival.time"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>到达时间</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中转信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              中转信息
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendLayover({
                    city: "",
                    airport: "",
                    code: "",
                    terminal: "",
                    flightNumber: "",
                    duration: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                添加中转
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {layoverFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无中转信息
              </p>
            ) : (
              <div className="space-y-4">
                {layoverFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">中转 {index + 1}</h5>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLayover(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`layovers.${index}.city`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>中转城市</FormLabel>
                            <FormControl>
                              <Input placeholder="广州" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`layovers.${index}.airport`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>中转机场</FormLabel>
                            <FormControl>
                              <Input placeholder="白云国际机场" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`layovers.${index}.code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>机场代码</FormLabel>
                            <FormControl>
                              <Input placeholder="CAN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`layovers.${index}.terminal`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>候机楼</FormLabel>
                            <FormControl>
                              <Input placeholder="T1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`layovers.${index}.flightNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>航班号</FormLabel>
                            <FormControl>
                              <Input placeholder="CA5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`layovers.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>中转时长</FormLabel>
                            <FormControl>
                              <Input placeholder="2小时30分钟" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 返程信息 - 仅往返航班显示 */}
        {watchType === "round-trip" && (
          <Card>
            <CardHeader>
              <CardTitle>返程信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 返程航班号和飞行时间 */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="returnFlight.flightNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>返程航班号</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CA4321"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnFlight.flightDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>返程飞行时间</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="2小时30分钟"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 返程出发信息 */}
              <div className="space-y-4">
                <h4 className="font-medium">返程出发信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnFlight.departure.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>出发城市</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="上海"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.departure.airport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>出发机场</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="浦东国际机场"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.departure.code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>机场代码</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="PVG"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.departure.terminal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>候机楼</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="T2"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.departure.time"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>出发时间</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* 返程到达信息 */}
              <div className="space-y-4">
                <h4 className="font-medium">返程到达信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnFlight.arrival.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>到达城市</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="北京"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.arrival.airport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>到达机场</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="首都国际机场"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.arrival.code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>机场代码</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="PEK"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.arrival.terminal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>候机楼</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="T3"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlight.arrival.time"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>到达时间</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 返程中转信息 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">返程中转信息</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendReturnLayover({
                        city: "",
                        airport: "",
                        code: "",
                        terminal: "",
                        flightNumber: "",
                        duration: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加返程中转
                  </Button>
                </div>

                {returnLayoverFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    暂无返程中转信息
                  </p>
                ) : (
                  <div className="space-y-4">
                    {returnLayoverFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">返程中转 {index + 1}</h5>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeReturnLayover(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.city`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>中转城市</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="广州"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.airport`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>中转机场</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="白云国际机场"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>机场代码</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="CAN"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.terminal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>候机楼</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="T1"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.flightNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>航班号</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="CA8765"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`returnFlight.layovers.${index}.duration`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>中转时长</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="2小时30分钟"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 航空公司信息 */}
        <Card>
          <CardHeader>
            <CardTitle>航空公司信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="airline.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航空公司名称</FormLabel>
                  <FormControl>
                    <Input placeholder="中国国际航空" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="airline.code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航空公司代码</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 行李信息 */}
        <Card>
          <CardHeader>
            <CardTitle>行李信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 手提行李 */}
            <div className="space-y-4">
              <h4 className="font-medium">手提行李</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baggage.cabin.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重量</FormLabel>
                      <FormControl>
                        <Input placeholder="7kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baggage.cabin.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数量</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* 托运行李 */}
            <div className="space-y-4">
              <h4 className="font-medium">托运行李</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baggage.checked.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重量</FormLabel>
                      <FormControl>
                        <Input placeholder="23kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baggage.checked.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数量</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 服务设施 */}
        <Card>
          <CardHeader>
            <CardTitle>服务设施</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="添加服务设施"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
              />
              <Button type="button" onClick={addAmenity}>
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {amenity}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeAmenity(index)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 标签 */}
        <Card>
          <CardHeader>
            <CardTitle>标签</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="添加标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag}>
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(index)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 状态 */}
        <Card>
          <CardHeader>
            <CardTitle>状态</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>航班状态</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">激活</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || imageUploading}
        >
          {imageUploading
            ? "上传图片中..."
            : isLoading
            ? "创建中..."
            : "创建航班"}
        </Button>
      </form>
    </Form>
  );
}
